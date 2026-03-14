import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainPage from "@/pages/MainPage/MainPage";
import QuizPage from "@/pages/QuizPage/QuizPage";
import ResultPage from "@/pages/ResultPage/ResultPage";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<MainPage />} />
				<Route path="/quiz" element={<QuizPage />} />
				<Route path="/result" element={<ResultPage />} />
			</Routes>
		</BrowserRouter>
	);
}
