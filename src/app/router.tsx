import { createHashRouter } from 'react-router-dom';
import App from './App';
import { DecksPage } from '../features/decks/DecksPage';
import { DeckDetailsPage } from '../features/decks/DeckDetailsPage';
import { QuizPage } from '../features/quiz/QuizPage';
import { StatsPage } from '../features/stats/StatsPage';
import { WritingPage } from '../features/writing/WritingPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <DecksPage /> },
      { path: '/decks/:deckId', element: <DeckDetailsPage /> },
      { path: '/quiz', element: <QuizPage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/writing', element: <WritingPage /> },
    ],
  },
]);