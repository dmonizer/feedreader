'use client';

interface LanguageSelectionStepProps {
    availableLanguages: string[];
    selectedLanguages: string[];
    onLanguagesChange: (languages: string[]) => void;
}

export function LanguageSelectionStep({
    availableLanguages,
    selectedLanguages,
    onLanguagesChange,
}: LanguageSelectionStepProps) {
    const toggleLanguage = (language: string) => {
        if (selectedLanguages.includes(language)) {
            onLanguagesChange(selectedLanguages.filter(l => l !== language));
        } else {
            onLanguagesChange([...selectedLanguages, language]);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold mb-2">In what languages do you want to read your news?</h2>
                <p className="text-gray-600 text-sm">Select one or more languages</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableLanguages.map((language) => {
                    const isSelected = selectedLanguages.includes(language);
                    return (
                        <button
                            key={language}
                            onClick={() => toggleLanguage(language)}
                            className={`
                p-4 rounded-lg border-2 transition-all
                ${isSelected
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }
              `}
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-1">{getLanguageFlag(language)}</div>
                                <div className="font-medium text-sm">{getLanguageName(language)}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedLanguages.length > 0 && (
                <div className="text-sm text-gray-600">
                    Selected: {selectedLanguages.map(getLanguageName).join(', ')}
                </div>
            )}
        </div>
    );
}

// Helper functions for language display
function getLanguageFlag(code: string): string {
    const flags: Record<string, string> = {
        en: '🇬🇧',
        es: '🇪🇸',
        fr: '🇫🇷',
        de: '🇩🇪',
        it: '🇮🇹',
        pt: '🇵🇹',
        ru: '🇷🇺',
        zh: '🇨🇳',
        ja: '🇯🇵',
        ko: '🇰🇷',
        ar: '🇸🇦',
        nl: '🇳🇱',
        pl: '🇵🇱',
        tr: '🇹🇷',
        sv: '🇸🇪',
        no: '🇳🇴',
        da: '🇩🇰',
        fi: '🇫🇮',
    };
    return flags[code] || '🌐';
}

function getLanguageName(code: string): string {
    const names: Record<string, string> = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        pt: 'Portuguese',
        ru: 'Russian',
        zh: 'Chinese',
        ja: 'Japanese',
        ko: 'Korean',
        ar: 'Arabic',
        nl: 'Dutch',
        pl: 'Polish',
        tr: 'Turkish',
        sv: 'Swedish',
        no: 'Norwegian',
        da: 'Danish',
        fi: 'Finnish',
    };
    return names[code] || code.toUpperCase();
}
