"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Type, Moon, Sun, ArrowDown } from "lucide-react";

export function AccessibilityBar() {
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has dark mode preference
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);

    // Check if user has high-contrast mode preference
    const isHighContrast =
      document.documentElement.classList.contains("contrast");
    setHighContrast(isHighContrast);
  }, []);

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 10, 150);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 10, 80);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
  };

  const resetFontSize = () => {
    setFontSize(100);
    document.documentElement.style.fontSize = "100%";
  };

  const toggleContrast = () => {
    setHighContrast(!highContrast);
    if (!highContrast) {
      document.documentElement.classList.add("contrast");
    } else {
      document.documentElement.classList.remove("contrast");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const skipToMainContent = () => {
    const main = document.querySelector("main");
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: "smooth" });
    }
  };

  const skipToFooter = () => {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.focus();
      footer.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="bg-muted border-b border-border"
      role="navigation"
      aria-label="Barra de acessibilidade"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Acessibilidade:
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipToMainContent}
              className="h-8 text-xs cursor-pointer"
              aria-label="Pular para o conteúdo principal"
            >
              Pular para conteúdo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipToFooter}
              className="h-8 text-xs gap-1 cursor-pointer"
              aria-label="Ir para o rodapé"
            >
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">Rodapé</span>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              className="h-8 w-8 p-0 cursor-pointer"
              aria-label="Diminuir tamanho da fonte"
              disabled={fontSize <= 80}
            >
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetFontSize}
              className="h-8 px-2 text-xs cursor-pointer"
              aria-label="Redefinir tamanho da fonte"
            >
              <Type className="h-4 w-4 mr-1" aria-hidden="true" />
              {fontSize}%
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              className="h-8 w-8 p-0 cursor-pointer"
              aria-label="Aumentar tamanho da fonte"
              disabled={fontSize >= 150}
            >
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div className="w-px h-6 bg-border mx-2" aria-hidden="true" />

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-8 w-8 p-0 cursor-pointer"
              aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
              aria-pressed={darkMode}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleContrast}
              className="h-8 px-2 text-xs hidden md:flex cursor-pointer"
              aria-label={
                highContrast
                  ? "Desativar alto contraste"
                  : "Ativar alto contraste"
              }
              aria-pressed={highContrast}
            >
              Alto Contraste
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
