'use client';

interface TopicSelectionStepProps {
    availableTopics: Array<{ topic: string; count: number }>;
    selectedTopics: string[];
    onTopicsChange: (topics: string[]) => void;
}

export function TopicSelectionStep({
    availableTopics,
    selectedTopics,
    onTopicsChange,
}: TopicSelectionStepProps) {
    const toggleTopic = (topic: string) => {
        if (selectedTopics.includes(topic)) {
            onTopicsChange(selectedTopics.filter(t => t !== topic));
        } else {
            onTopicsChange([...selectedTopics, topic]);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold mb-2">What topics interest you?</h2>
                <p className="text-gray-600 text-sm">Select one or more topics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {availableTopics.map(({ topic, count }) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                        <button
                            key={topic}
                            onClick={() => toggleTopic(topic)}
                            className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${isSelected
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }
              `}
                        >
                            <div className="flex justify-between items-center">
                              { topic.length <= 3 ? (
                                <span className="font-medium">{topic.toUpperCase()}</span>
                              ) : (
                                <span className="font-medium capitalize">{topic}</span>
                              )}
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                    {count}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedTopics.length > 0 && (
                <div className="text-sm text-gray-600">
                    Selected: {selectedTopics.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                </div>
            )}
        </div>
    );
}
