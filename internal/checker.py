#!/usr/bin/env python3

import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List
import sys
from datetime import datetime

def check_url(url: str, timeout: int = 10) -> tuple[str, int, str]:
    """Check if URL responds with 200. Returns (url, status_code, error_msg)"""
    try:
        response = requests.head(url, timeout=timeout, allow_redirects=True,
                                 headers={'User-Agent': 'Mozilla/5.0 RSS Feed Validator'})
        # Try GET if HEAD fails
        if response.status_code >= 400:
            response = requests.get(url, timeout=timeout, allow_redirects=True,
                                    headers={'User-Agent': 'Mozilla/5.0 RSS Feed Validator'})
        return (url, response.status_code, '')
    except requests.exceptions.Timeout:
        return (url, 0, 'Timeout')
    except requests.exceptions.ConnectionError:
        return (url, 0, 'Connection Error')
    except requests.exceptions.TooManyRedirects:
        return (url, 0, 'Too Many Redirects')
    except Exception as e:
        return (url, 0, str(e))

def verify_feed(feed: Dict, max_workers: int = 5) -> tuple[Dict, List[str]]:
    """Verify both RSS and main URLs for a feed. Returns (feed, errors)"""
    errors = []

    rss_url = feed.get('rss_url', '')
    main_url = feed.get('main_url', '')

    urls_to_check = []
    if rss_url:
        urls_to_check.append(('rss', rss_url))
    if main_url:
        urls_to_check.append(('main', main_url))

    for url_type, url in urls_to_check:
        url_str, status, error = check_url(url)
        if status != 200:
            error_msg = f"{feed['name']} - {url_type}: {url} -> Status: {status}"
            if error:
                error_msg += f" ({error})"
            errors.append(error_msg)

    return (feed, errors)

def main():
    if len(sys.argv) < 2:
        print("Usage: python verify_rss_feeds.py <input_json> [output_json] [log_file]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'verified_feeds.json'
    log_file = sys.argv[3] if len(sys.argv) > 3 else 'verification_errors.log'

    # Load feeds
    with open(input_file, 'r', encoding='utf-8') as f:
        feeds = json.load(f)

    print(f"Loaded {len(feeds)} feeds. Starting verification...")

    verified_feeds = []
    all_errors = []

    # Verify feeds with thread pool
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(verify_feed, feed): feed for feed in feeds}

        for i, future in enumerate(as_completed(futures), 1):
            feed, errors = future.result()

            if not errors:
                verified_feeds.append(feed)
            else:
                all_errors.extend(errors)

            if i % 50 == 0:
                print(f"Processed {i}/{len(feeds)} feeds...")

    # Write verified feeds
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(verified_feeds, f, indent=2, ensure_ascii=False)

    # Write error log
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write(f"RSS Feed Verification Log - {datetime.now().isoformat()}\n")
        f.write(f"Total feeds checked: {len(feeds)}\n")
        f.write(f"Verified feeds: {len(verified_feeds)}\n")
        f.write(f"Failed feeds: {len(feeds) - len(verified_feeds)}\n")
        f.write(f"\n{'='*80}\n\n")
        for error in all_errors:
            f.write(f"{error}\n")

    print(f"\nVerification complete!")
    print(f"Total feeds: {len(feeds)}")
    print(f"Verified feeds: {len(verified_feeds)}")
    print(f"Failed feeds: {len(feeds) - len(verified_feeds)}")
    print(f"\nVerified feeds saved to: {output_file}")
    print(f"Error log saved to: {log_file}")

if __name__ == '__main__':
    main()