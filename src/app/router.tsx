import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DecksPage from "../features/decks/DecksPage";
import QuizPage from "../features/quiz/QuizPage";
import StatsPage from "../features/stats/StatsPage";
import Nav from "../components/Nav";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Nav />
        <DecksPage />
      </>
    ),
  },
  {
    path: "/quiz",
    element: (
      <>
        <Nav />
        <QuizPage />
      </>
    ),
  },
  {
    path: "/stats",
    element: (
      <>
        <Nav />
        <StatsPage />
      </>
    ),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}