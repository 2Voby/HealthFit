import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { error?: Error }

export default function ErrorPage({ error }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-5 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Щось пішло не так</h1>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Сталася неочікувана помилка. Спробуй оновити сторінку або повернись на головну.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-[320px] rounded-lg bg-muted px-4 py-3 text-left">
          <p className="text-xs font-medium text-muted-foreground mb-1">Деталі помилки</p>
          <p className="text-xs font-mono text-destructive break-all">{error.message}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Оновити
        </Button>
        <Button
          size="sm"
          onClick={() => window.location.replace("/")}
        >
          <Home className="w-4 h-4 mr-2" />
          На головну
        </Button>
      </div>
    </div>
  );
}