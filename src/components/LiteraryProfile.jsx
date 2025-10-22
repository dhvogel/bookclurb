import React, { useState, useEffect } from "react";
import HeaderBar from "./HeaderBar";

const LiteraryProfile = ({ user, db }) => {
  const [groupAnalysis, setGroupAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Book data from your existing tracking
  const books = [
    {
      title: "Tale of Two Cities",
      author: "Charles Dickens",
      genre: "Classic Literature",
      themes: [
        "Social Justice",
        "Revolution",
        "Sacrifice",
        "Historical Fiction",
      ],
      year: 1859,
      difficulty: "Advanced",
    },
    {
      title: "Grapes of Wrath",
      author: "John Steinbeck",
      genre: "American Literature",
      themes: ["Social Justice", "Poverty", "Family", "American Dream"],
      year: 1939,
      difficulty: "Advanced",
    },
    {
      title: "Socialism",
      author: "Michael Harrington",
      genre: "Political Philosophy",
      themes: ["Social Justice", "Political Theory", "Economic Systems"],
      year: 1972,
      difficulty: "Advanced",
    },
    {
      title: "Bomber Mafia",
      author: "Malcolm Gladwell",
      genre: "Non-fiction",
      themes: ["History", "Technology", "War", "Innovation"],
      year: 2021,
      difficulty: "Intermediate",
    },
    {
      title: "The Secret Agent",
      author: "Joseph Conrad",
      genre: "Literary Fiction",
      themes: [
        "Terrorism",
        "Political Intrigue",
        "Psychological",
        "Moral Ambiguity",
      ],
      year: 1907,
      difficulty: "Advanced",
    },
    {
      title: "Catch-22",
      author: "Joseph Heller",
      genre: "Satirical Fiction",
      themes: ["War", "Absurdity", "Bureaucracy", "Dark Humor"],
      year: 1961,
      difficulty: "Advanced",
    },
    {
      title: "Valiant Ambition",
      author: "Nathaniel Philbrick",
      genre: "Historical Non-fiction",
      themes: ["American History", "Revolution", "Leadership", "Patriotism"],
      year: 2016,
      difficulty: "Intermediate",
    },
    {
      title: "Poor Economics",
      author: "Abhijit Banerjee & Esther Duflo",
      genre: "Economics",
      themes: ["Poverty", "Development", "Economics", "Social Policy"],
      year: 2011,
      difficulty: "Advanced",
    },
    {
      title: "The Fourth Turning",
      author: "William Strauss & Neil Howe",
      genre: "Social Theory",
      themes: ["Generational Theory", "History", "Social Cycles", "Future"],
      year: 1997,
      difficulty: "Advanced",
    },
  ];

  useEffect(() => {
    // Simulate AI analysis (in real implementation, this would call an AI service)
    const analyzeBookClubPersonality = () => {
      // Calculate genre distribution
      const genres = books.map((book) => book.genre);
      const genreCount = genres.reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});

      // Extract all themes
      const allThemes = books.flatMap((book) => book.themes);
      const themeCount = allThemes.reduce((acc, theme) => {
        acc[theme] = (acc[theme] || 0) + 1;
        return acc;
      }, {});

      // Calculate average difficulty
      const difficultyLevels = { Intermediate: 2, Advanced: 3 };
      const avgDifficulty =
        books.reduce(
          (sum, book) => sum + difficultyLevels[book.difficulty],
          0
        ) / books.length;

      // Analyze time periods
      const decades = books.map((book) => Math.floor(book.year / 10) * 10);
      const decadeCount = decades.reduce((acc, decade) => {
        acc[decade] = (acc[decade] || 0) + 1;
        return acc;
      }, {});

      return {
        totalBooks: books.length,
        genreDistribution: genreCount,
        topThemes: Object.entries(themeCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([theme, count]) => ({ theme, count })),
        averageDifficulty: avgDifficulty,
        decadeDistribution: decadeCount,
        personalityInsights: generatePersonalityInsights(
          genreCount,
          themeCount,
          avgDifficulty
        ),
      };
    };

    const generatePersonalityInsights = (genres, themes, difficulty) => {
      const insights = [];

      // Genre analysis
      if (genres["Classic Literature"] > 0) {
        insights.push(
          "Your club appreciates timeless literary works that have stood the test of time."
        );
      }
      if (genres["Political Philosophy"] > 0 || genres["Economics"] > 0) {
        insights.push(
          "You're drawn to books that challenge conventional thinking about society and systems."
        );
      }
      if (genres["Historical Non-fiction"] > 0) {
        insights.push(
          "Your group values understanding how historical events shape the present."
        );
      }

      // Theme analysis
      const socialJusticeCount = themes["Social Justice"] || 0;
      if (socialJusticeCount >= 3) {
        insights.push(
          "Social justice is a core value for your book club - you consistently choose books that explore inequality and systemic issues."
        );
      }

      // Difficulty analysis
      if (difficulty >= 2.5) {
        insights.push(
          "Your club isn't afraid of challenging, intellectually demanding reads."
        );
      }

      // Reading pattern insights
      insights.push(
        "Your selections show a preference for books that generate deep, meaningful discussion over light entertainment."
      );
      insights.push(
        "You value diverse perspectives, from classic literature to contemporary social theory."
      );

      return insights;
    };

    // Simulate API call delay
    setTimeout(() => {
      const analysis = analyzeBookClubPersonality();
      setGroupAnalysis(analysis);
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div>
        <HeaderBar user={user} db={db} />
        <div className="p-4" style={{ marginTop: "100px" }}>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing your literary DNA...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeaderBar user={user} db={db} />
      <div className="p-4" style={{ marginTop: "100px" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Literary Profile
          </h1>
          <p className="text-gray-600 mb-8">
            Discover what your book choices reveal about your collective
            personality
          </p>

          {/* Group Analysis Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📚</span>
              Your Book Club's Literary DNA
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Reading Statistics
                </h3>
                <p className="text-sm text-gray-600">
                  Total Books Read:{" "}
                  <span className="font-semibold">
                    {groupAnalysis.totalBooks}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Average Difficulty:{" "}
                  <span className="font-semibold">
                    {groupAnalysis.averageDifficulty >= 2.5
                      ? "Advanced"
                      : "Intermediate"}
                  </span>
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Top Themes</h3>
                <div className="space-y-2 max-w-xs mx-auto">
                  {groupAnalysis.topThemes.map(({ theme, count }, index) => {
                    // Slight color scale accent for rows
                    const accentColors = [
                      "bg-indigo-100",
                      "bg-indigo-200",
                      "bg-purple-100",
                      "bg-indigo-300",
                      "bg-purple-200",
                    ];
                    const colorIndex =
                      count > 4 ? 4 : count - 1 >= 0 ? count - 1 : 0;
                    const bubbleClass =
                      accentColors[colorIndex] +
                      " flex items-center justify-between px-3 py-2 rounded-lg shadow-sm transition transform hover:scale-102";
                    return (
                      <div
                        key={theme}
                        className={bubbleClass}
                        style={{
                          minWidth: 0,
                          fontSize: "1rem",
                          border: "1px solid #818cf8",
                          maxWidth: "100%",
                        }}
                      >
                        <div className="flex items-center min-w-0">
                          <span
                            className="inline-block mr-2 text-indigo-700"
                            style={{ fontSize: "1.15rem" }}
                          >
                            {
                              [
                                "🌱",
                                "🏛️",
                                "🏞️",
                                "🕵️",
                                "⚔️",
                                "🚀",
                                "❤️",
                                "👪",
                                "🧠",
                                "🌍",
                                "📜",
                                "💀",
                                "🎭",
                                "🔍",
                              ][index % 13]
                            }
                          </span>
                          <span
                            className="truncate text-gray-900 font-medium"
                            style={{ maxWidth: "8rem" }}
                          >
                            {theme} - {count}
                          </span>
                        </div>
                        <span
                          className="ml-3 min-w-[2rem] px-2 text-sm font-bold rounded-full text-indigo-700 bg-white border border-indigo-200 shadow-sm"
                          style={{
                            textAlign: "center",
                          }}
                          title={`${count} books`}
                        ></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">🧠</span>
                What Your Choices Say About You
              </h3>
              <div className="space-y-3">
                {groupAnalysis.personalityInsights.map((insight, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-indigo-500 mr-2 mt-1">•</span>
                    <p className="text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Summary Section - Placeholder */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">👤</span>
              Personal Reading Profile
            </h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Personal Analysis Coming Soon
              </h3>
              <p className="text-gray-500">
                Individual reading profiles will analyze your personal
                participation, favorite themes, and reading patterns within the
                group.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiteraryProfile;
