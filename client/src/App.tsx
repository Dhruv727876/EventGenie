/**
 * @module EventGenie/App
 * @description Root application view coordinating state, lazy components, and Firestore persistence
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';

// --- Internal Modules ---
import { EventType, Vendor, EventIdea } from './types';
import { DEBOUNCE_DELAY_MS } from './constants/limits';
import { loadUserPlan, logPlanEvent, saveUserPlan } from './firebase';

// --- Utilities ---
import { generateId } from './utils/helpers';

// --- Components ---
import { Header } from './components/Header';
import { WelcomeBanner } from './components/WelcomeBanner';
import { EventTypeSelector } from './components/EventTypeSelector';
import { ErrorBoundary } from './components/ErrorBoundary';

// --- Hooks ---
import { useAuth } from './hooks/useAuth';
import { usePlanManager } from './hooks/usePlanManager';
import { useBudget } from './hooks/useBudget';
import { useTimeline } from './hooks/useTimeline';

const ChatInterface = React.lazy(() =>
  import('./components/ChatInterface').then((m) => ({ default: m.ChatInterface }))
);
const BudgetTracker = React.lazy(() =>
  import('./components/BudgetTracker').then((m) => ({ default: m.BudgetTracker }))
);
const TimelineView = React.lazy(() =>
  import('./components/TimelineView').then((m) => ({ default: m.TimelineView }))
);
const VendorChecklist = React.lazy(() =>
  import('./components/VendorChecklist').then((m) => ({ default: m.VendorChecklist }))
);
const IdeaGenerator = React.lazy(() =>
  import('./components/IdeaGenerator').then((m) => ({ default: m.IdeaGenerator }))
);

const AppComponent: React.FC = () => {
  const { user, loading: authLoading, isNew } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [isReturningUser, setIsReturningUser] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const hasLoadedRef = useRef<boolean>(false);

  // Initial plan manager hook
  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    eventType,
    sendMessage,
    setEventType,
  } = usePlanManager(user?.uid);

  // Budget management hook
  const {
    items: budgetItems,
    totalEstimated,
    totalActual,
    percentageUsed,
    categoryPercentages,
    addItem: addBudgetItem,
    updateItem: updateBudgetItem,
    removeItem: removeBudgetItem,
  } = useBudget(user?.uid, eventType);

  // Timeline management hook
  const {
    milestones,
    percentComplete,
    addMilestone,
    toggleComplete: toggleMilestoneComplete,
    removeMilestone,
  } = useTimeline(user?.uid, eventType);

  // Vendor state management
  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: 'vendor-1',
      name: 'Crystal View Ballroom',
      category: 'Venue',
      contact: 'events@crystalview.com',
      status: 'booked',
      cost: 4500,
    },
    {
      id: 'vendor-2',
      name: 'Artisan Heritage Catering',
      category: 'Catering',
      contact: '+1 555-0199',
      status: 'contacted',
      cost: 3200,
    },
  ]);

  const vendorsRef = useRef<Vendor[]>(vendors);
  vendorsRef.current = vendors;
  const vendorDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // App load telemetry
  useEffect(() => {
    logPlanEvent('app_load', { timestamp: Date.now() });
  }, []);

  // Sync returning user status from auth state
  useEffect(() => {
    if (!isNew && user?.uid) {
      setIsReturningUser(true);
    }
  }, [isNew, user]);

  // Guarded Firestore read to detect returning user session data - fetch exactly once
  useEffect(() => {
    const shouldSkipCheck = !user?.uid || hasLoadedRef.current;
    if (shouldSkipCheck) {
      return;
    }
    hasLoadedRef.current = true;

    loadUserPlan(user.uid)
      .then((saved) => {
        if (saved) {
          const hasPriorData =
            saved.chatHistory.length > 0 ||
            saved.budget.length > 0 ||
            saved.timeline.length > 0;
          if (hasPriorData) {
            setIsReturningUser(true);
          }
          if (saved.vendors.length > 0) {
            setVendors(saved.vendors);
          }
        }
      })
      .catch((_err: unknown) => {
        // silent fallback
      });
  }, [user?.uid]);

  const scheduleVendorSave = useCallback(
    (newVendors: Vendor[]) => {
      if (!user?.uid) {
        return;
      }
      if (vendorDebounceTimerRef.current) {
        clearTimeout(vendorDebounceTimerRef.current);
      }
      vendorDebounceTimerRef.current = setTimeout(() => {
        saveUserPlan(user.uid, {
          vendors: newVendors,
          lastUpdated: Date.now(),
        }).catch((_err: unknown) => {
          // silent fallback
        });
      }, DEBOUNCE_DELAY_MS);
    },
    [user?.uid]
  );

  const handleTabChange = useCallback((tab: string): void => {
    setActiveTab(tab);
  }, []);

  const handleEventTypeSelect = useCallback(
    (type: EventType): void => {
      setEventType(type);
      logPlanEvent('event_type_selected', { type });
    },
    [setEventType]
  );

  const handleSendMessage = useCallback(
    (text: string): void => {
      sendMessage(text);
      logPlanEvent('chat_message_sent', { length: text.length });
    },
    [sendMessage]
  );

  const handleAddBudgetItem = useCallback(
    (cat: string, desc: string, est: number, act?: number): void => {
      addBudgetItem(cat, desc, est, act);
      logPlanEvent('budget_item_added', { category: cat, estimated: est });
    },
    [addBudgetItem]
  );

  const handleUpdateBudgetItem = useCallback(
    (id: string, updates: Partial<Omit<import('./types').BudgetItem, 'id'>>): void => {
      updateBudgetItem(id, updates);
      logPlanEvent('budget_item_updated', { id });
    },
    [updateBudgetItem]
  );

  const handleRemoveBudgetItem = useCallback(
    (id: string): void => {
      removeBudgetItem(id);
      logPlanEvent('budget_updated', { action: 'remove', id });
    },
    [removeBudgetItem]
  );

  const handleToggleMilestone = useCallback(
    (id: string): void => {
      toggleMilestoneComplete(id);
      logPlanEvent('timeline_milestone_completed', { milestoneId: id });
    },
    [toggleMilestoneComplete]
  );

  const handleAddMilestone = useCallback(
    (title: string, dueDate: string, notes?: string): void => {
      addMilestone(title, dueDate, notes);
      logPlanEvent('timeline_milestone_added', { title });
    },
    [addMilestone]
  );

  const handleRemoveMilestone = useCallback(
    (id: string): void => {
      removeMilestone(id);
      logPlanEvent('timeline_updated', { action: 'remove', id });
    },
    [removeMilestone]
  );

  const handleToggleVendorStatus = useCallback(
    (id: string, status: Vendor['status']): void => {
      const updated = vendorsRef.current.map((v) => (v.id === id ? { ...v, status } : v));
      setVendors(updated);
      logPlanEvent('vendor_status_changed', { id, status });
      scheduleVendorSave(updated);
    },
    [scheduleVendorSave]
  );

  const handleAddVendor = useCallback(
    (name: string, category: string, contact: string, cost: number): void => {
      const newVendor: Vendor = {
        id: generateId(),
        name,
        category,
        contact,
        status: 'pending',
        cost,
      };
      const updated = [...vendorsRef.current, newVendor];
      setVendors(updated);
      logPlanEvent('vendor_toggled', { action: 'add_vendor', name });
      scheduleVendorSave(updated);
    },
    [scheduleVendorSave]
  );

  const handleRemoveVendor = useCallback(
    (id: string): void => {
      const updated = vendorsRef.current.filter((v) => v.id !== id);
      setVendors(updated);
      logPlanEvent('vendor_toggled', { action: 'remove_vendor', id });
      scheduleVendorSave(updated);
    },
    [scheduleVendorSave]
  );

  const handleSelectIdea = useCallback(
    (ideaText: string): void => {
      setActiveTab('chat');
      sendMessage(`Please integrate this idea into my plan: "${ideaText}"`);
    },
    [sendMessage]
  );

  const handleAddIdeaToPlan = useCallback(
    (idea: EventIdea): void => {
      addBudgetItem(idea.category, idea.title, 500);
      addMilestone(`Organize: ${idea.title}`, '', idea.description);
      logPlanEvent('idea_generated', { action: 'added_to_plan', ideaId: idea.id });
      setActiveTab('budget');
    },
    [addBudgetItem, addMilestone]
  );

  const handleDismissWelcome = useCallback((): void => {
    setShowWelcome(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-orange-500 focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>

      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showWelcome && (
          <WelcomeBanner
            isReturningUser={isReturningUser}
            eventType={eventType}
            onDismiss={handleDismissWelcome}
          />
        )}

        <section role="region" aria-label="Event persona selection" className="mb-6">
          <EventTypeSelector
            selectedType={eventType}
            onSelect={handleEventTypeSelect}
          />
        </section>

        {authLoading && (
          <div role="status" aria-live="polite" className="text-center py-8 text-slate-500 text-sm">
            Initializing secure session...
          </div>
        )}

        <ErrorBoundary>
          <div role="region" aria-label="Event planning work area">
            {activeTab === 'chat' && (
              <div id="tabpanel-chat" role="tabpanel" aria-labelledby="tab-chat">
                <Suspense
                  fallback={
                    <div role="status" aria-live="polite" className="p-8 text-center text-slate-400">
                      Loading chat assistant...
                    </div>
                  }
                >
                  <ChatInterface
                    messages={messages}
                    isLoading={isChatLoading}
                    error={chatError}
                    onSendMessage={handleSendMessage}
                    eventType={eventType}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'budget' && (
              <div id="tabpanel-budget" role="tabpanel" aria-labelledby="tab-budget">
                <Suspense
                  fallback={
                    <div role="status" aria-live="polite" className="p-8 text-center text-slate-400">
                      Loading budget manager...
                    </div>
                  }
                >
                  <BudgetTracker
                    items={budgetItems}
                    totalEstimated={totalEstimated}
                    totalActual={totalActual}
                    percentageUsed={percentageUsed}
                    categoryPercentages={categoryPercentages}
                    onAddItem={handleAddBudgetItem}
                    onUpdateItem={handleUpdateBudgetItem}
                    onRemoveItem={handleRemoveBudgetItem}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div id="tabpanel-timeline" role="tabpanel" aria-labelledby="tab-timeline">
                <Suspense
                  fallback={
                    <div role="status" aria-live="polite" className="p-8 text-center text-slate-400">
                      Loading timeline schedule...
                    </div>
                  }
                >
                  <TimelineView
                    milestones={milestones}
                    percentComplete={percentComplete}
                    onToggleComplete={handleToggleMilestone}
                    onAddMilestone={handleAddMilestone}
                    onRemoveMilestone={handleRemoveMilestone}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'vendors' && (
              <div id="tabpanel-vendors" role="tabpanel" aria-labelledby="tab-vendors">
                <Suspense
                  fallback={
                    <div role="status" aria-live="polite" className="p-8 text-center text-slate-400">
                      Loading vendor checklist...
                    </div>
                  }
                >
                  <VendorChecklist
                    vendors={vendors}
                    onToggleStatus={handleToggleVendorStatus}
                    onAddVendor={handleAddVendor}
                    onRemoveVendor={handleRemoveVendor}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'ideas' && (
              <div id="tabpanel-ideas" role="tabpanel" aria-labelledby="tab-ideas">
                <Suspense
                  fallback={
                    <div role="status" aria-live="polite" className="p-8 text-center text-slate-400">
                      Loading idea sparks...
                    </div>
                  }
                >
                  <IdeaGenerator
                    eventType={eventType}
                    onSelectIdea={handleSelectIdea}
                    onAddToPlan={handleAddIdeaToPlan}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </main>

      <footer role="contentinfo" className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>© 2026 EventGenie. GenAI planning assistant for memorable weddings, birthdays, and community events.</p>
        </div>
      </footer>
    </div>
  );
};

/**
 * Root application component wrapping providers, accessibility regions, and event managers
 */
export const App = React.memo(AppComponent);
export default App;
