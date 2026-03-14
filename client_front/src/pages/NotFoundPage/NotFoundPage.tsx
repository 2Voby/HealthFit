// src/pages/NotFoundPage/NotFoundPage.tsx
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-5 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
        <MapPin className="w-8 h-8 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-6xl font-black text-gray-900">404</p>
        <h1 className="text-xl font-bold">Сторінку не знайдено</h1>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          Схоже, ця сторінка не існує або була переміщена.
        </p>
      </div>

      <Button onClick={() => navigate("/")}>
        На головну
      </Button>
    </div>
  );
}