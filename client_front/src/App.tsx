import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainPage from "@/pages/MainPage/MainPage";
import QuizPage from "@/pages/QuizPage/QuizPage";
import ResultPage from "@/pages/ResultPage/ResultPage";
import WithHeader from "@/layouts/WithHeader";
import Blank from "@/layouts/Blank";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<WithHeader />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Route>
        <Route element={<Blank />}>
          <Route path="/quiz" element={<QuizPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}