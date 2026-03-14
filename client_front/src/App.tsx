import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/consts/routes";
import LoginPage from "@/pages/LoginPage/LoginPage";
import MainPage from "@/pages/MainPage/MainPage";
import ProfilePage from "@/pages/ProfilePage/ProfilePage";
import QuizPage from "@/pages/QuizPage/QuizPage";
import ResultPage from "@/pages/ResultPage/ResultPage";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path={ROUTES.HOME} element={<Navigate to={ROUTES.MAIN} replace />} />
				<Route path={ROUTES.MAIN} element={<MainPage />} />
				<Route path={ROUTES.LOGIN} element={<LoginPage />} />
				<Route path={ROUTES.PROFILE} element={<ProfilePage />} />
				<Route path={ROUTES.QUIZ} element={<QuizPage />} />
				<Route path={ROUTES.RESULT} element={<ResultPage />} />
			</Routes>
		</BrowserRouter>
	);
}
