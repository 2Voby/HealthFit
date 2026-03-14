import { Outlet } from "react-router-dom";
import Header from "@/components/layouts/Header";

export default function WithHeader() {
    return (
        <>
            <Header />
            <Outlet />
        </>
    );
}