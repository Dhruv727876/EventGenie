/**
 * @module EventGenie/IdeaGenerator
 * @description Accessible GenAI spark generator with difficulty tags, cost ranges, and direct plan insertion
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { useState, useCallback, useMemo } from 'react';

// --- Internal Modules ---
import { EventType, EventIdea, isAIResponse, isRecord } from '../types';
import { API_ENDPOINTS } from '../constants';
import { logPlanEvent } from '../firebase';

// --- Utilities ---
import { generateId } from '../utils/helpers';
import { AIServiceError } from '../utils/errors';

/** Props interface for the IdeaGenerator component */
export interface IdeaGeneratorProps {
  eventType: EventType;
  onSelectIdea?: (idea: string) => void;
  onAddToPlan?: (idea: EventIdea) => void;
}

const CATEGORIES_BY_TYPE: Record<EventType, string[]> = {
  wedding: ['Themes & Vibes', 'Entertainment & Music', 'Guest Favors', 'Culinary Highlights'],
  birthday: ['Party Themes', 'Interactive Games', 'Cake & Treats', 'Photo Opportunities'],
  community: ['Crowd Engagement', 'Workshops & Activities', 'Local Sponsorships', 'Food & Refreshments'],
};

const INITIAL_IDEAS: Record<EventType, EventIdea[]> = {
  wedding: [
    {
      id: 'w-1',
      title: 'Enchanted Woodland Canopy',
      description: 'Fairy string lights, preserved moss accents, and vintage wooden farm tables with botanical greenery runners.',
      estimatedCost: '$1,200 - $2,500',
      difficulty: 'medium',
      category: 'Themes & Vibes',
    },
    {
      id: 'w-2',
      title: 'Acoustic Pop String Quartet',
      description: 'Classical string musicians performing modern romantic pop covers during your cocktail hour and ceremony.',
      estimatedCost: '$800 - $1,600',
      difficulty: 'easy',
      category: 'Entertainment & Music',
    },
    {
      id: 'w-3',
      title: 'Artisanal Honey Jar Favors',
      description: 'Miniature jars filled with wildflower honey from local regional apiaries with custom couple calligraphy tags.',
      estimatedCost: '$250 - $500',
      difficulty: 'easy',
      category: 'Guest Favors',
    },
  ],
  birthday: [
    {
      id: 'b-1',
      title: 'Neon Retro Arcade Night',
      description: 'Glow accessories, pixel art tabletop decor, retro synth playlists, and vintage tabletop arcade games.',
      estimatedCost: '$400 - $900',
      difficulty: 'easy',
      category: 'Party Themes',
    },
    {
      id: 'b-2',
      title: 'Custom Milestone Trivia Show',
      description: 'Interactive mobile quiz with customized multimedia questions celebrating fun life memories of the celebrant.',
      estimatedCost: '$100 - $300',
      difficulty: 'easy',
      category: 'Interactive Games',
    },
    {
      id: 'b-3',
      title: 'Interactive Crepe & Waffle Bar',
      description: 'Warm gourmet sweet crepes made live with fresh organic berries, melted chocolates, and hazelnut spreads.',
      estimatedCost: '$500 - $1,100',
      difficulty: 'medium',
      category: 'Cake & Treats',
    },
  ],
  community: [
    {
      id: 'c-1',
      title: 'Neighborhood Hands-On Mural',
      description: 'Large modular canvas where attendees paint collaborative geometric panels celebrating neighborhood pride.',
      estimatedCost: '$300 - $600',
      difficulty: 'easy',
      category: 'Crowd Engagement',
    },
    {
      id: 'c-2',
      title: 'Youth Urban Planting Workshop',
      description: 'Hands-on station where children pot their own tomato or culinary herb seedlings to take home and nurture.',
      estimatedCost: '$200 - $450',
      difficulty: 'easy',
      category: 'Workshops & Activities',
    },
    {
      id: 'c-3',
      title: 'Local Small Business Tasting Alley',
      description: 'Sponsored tasting zone with complimentary sample bites from neighborhood family-owned restaurants and cafes.',
      estimatedCost: '$350 - $700',
      difficulty: 'medium',
      category: 'Food & Refreshments',
    },
  ],
};

const DIFFICULTY_STYLES: Record<EventIdea['difficulty'], string> = {
  easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  hard: 'bg-rose-100 text-rose-800 border-rose-200',
};

const IdeaGeneratorComponent: React.FC<IdeaGeneratorProps> = ({
  eventType,
  onSelectIdea,
  onAddToPlan,
}) => {
  const categories = CATEGORIES_BY_TYPE[eventType] ?? CATEGORIES_BY_TYPE.wedding;
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] ?? 'Themes & Vibes');
  const [ideasList, setIdeasList] = useState<EventIdea[]>(INITIAL_IDEAS[eventType] ?? INITIAL_IDEAS.wedding);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const filteredIdeas = useMemo(() => {
    return ideasList.filter((idea) => idea.category === selectedCategory || ideasList.length <= 3);
  }, [ideasList, selectedCategory]);

  const handleFetchMoreIdeas = useCallback(async (): Promise<void> => {
    setIsLoadingMore(true);
    setError(null);
    logPlanEvent('idea_generated', { eventType, category: selectedCategory });

    try {
      const baseUrl = process.env.REACT_APP_API_URL ?? '';
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.ideas}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          category: selectedCategory,
        }),
      });

      if (!response.ok) {
        throw new AIServiceError('Failed to generate ideas');
      }

      const data: unknown = await response.json();
      const replyText = isAIResponse(data) ? data.reply : (isRecord(data) && typeof data.reply === 'string' ? data.reply : '');

      const newIdea: EventIdea = {
        id: generateId(),
        title: `AI Spark: ${selectedCategory}`,
        description: replyText.slice(0, 160) || `Innovative ${eventType} recommendation for ${selectedCategory}.`,
        estimatedCost: '$500 - $1,500',
        difficulty: 'medium',
        category: selectedCategory,
      };

      setIdeasList((prev) => [newIdea, ...prev]);
    } catch (_err) {
      setError('Unable to fetch additional ideas from AI service right now.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [eventType, selectedCategory]);

  const handleSelect = (idea: EventIdea): void => {
    logPlanEvent('idea_generated', { eventType, ideaId: idea.id, action: 'select' });
    if (onAddToPlan) {
      onAddToPlan(idea);
    } else if (onSelectIdea) {
      onSelectIdea(idea.title);
    }
  };

  return (
    <section
      role="region"
      aria-label="Idea generator"
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Personalized AI Idea Sparks</h2>
          <p className="text-xs text-slate-500">
            Inspiring themes, activities, and touches curated for your {eventType}
          </p>
        </div>
        <button
          type="button"
          onClick={handleFetchMoreIdeas}
          disabled={isLoadingMore}
          aria-label="Generate new event ideas"
          className="h-11 px-5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {isLoadingMore ? 'Generating...' : '✨ Generate More Ideas'}
        </button>
      </div>

      <fieldset className="border-0 p-0 m-0 mb-6" aria-labelledby="idea-category-legend">
        <legend id="idea-category-legend" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
          Select Idea Focus Area
        </legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-11 px-4 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-2 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <div role="alert" className="p-3 mb-4 text-xs bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={handleFetchMoreIdeas} className="h-11 px-3 underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingMore && (
        <div role="status" aria-live="polite" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <span className="sr-only">Generating ideas...</span>
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-5/6" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredIdeas.map((idea) => (
          <div
            key={idea.id}
            className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-orange-50/40 hover:border-orange-300 transition-all flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase ${DIFFICULTY_STYLES[idea.difficulty]}`}>
                  {idea.difficulty}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  {idea.estimatedCost}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">{idea.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{idea.description}</p>
            </div>

            <button
              type="button"
              onClick={() => handleSelect(idea)}
              aria-label={`Add ${idea.title} to your plan`}
              className="h-11 px-4 text-xs font-semibold text-orange-600 hover:text-white bg-white hover:bg-orange-500 border border-orange-200 rounded-lg transition-colors flex items-center justify-center shadow-2xs"
            >
              Add to Plan
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Creative idea generator showcasing curated concepts and themes with accessible fieldset filters
 */
export const IdeaGenerator = React.memo(IdeaGeneratorComponent);
