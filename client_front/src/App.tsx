import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainPage from "@/pages/MainPage/MainPage";
import QuizPage from "@/pages/QuizPage/QuizPage";
import ResultPage from "@/pages/ResultPage/ResultPage";
import WithHeader from "@/layouts/WithHeader";
import Blank from "@/layouts/Blank";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ErrorPage from "@/pages/ErrorPage/ErrorPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary fallback={<ErrorPage />}>
        <Routes>
          <Route element={<WithHeader />}>
            <Route path="/" element={<MainPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Route>
          <Route element={<Blank />}>
            <Route path="/quiz" element={<QuizPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}