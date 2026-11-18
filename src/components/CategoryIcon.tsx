import {
  Bus,
  Clapperboard,
  Lightbulb,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import type { ExpenseCategory } from "../data/budgetData";

interface CategoryIconProps {
  category: ExpenseCategory;
  className?: string;
}

export function CategoryIcon({ category, className = "w-4 h-4" }: CategoryIconProps) {
  switch (category) {
    case "Alimentación":
      return <Utensils className={className} aria-hidden="true" />;
    case "Transporte":
      return <Bus className={className} aria-hidden="true" />;
    case "Servicios públicos":
      return <Lightbulb className={className} aria-hidden="true" />;
    case "Ropa y compras personales":
      return <ShoppingBag className={className} aria-hidden="true" />;
    case "Entretenimiento y ocio":
      return <Clapperboard className={className} aria-hidden="true" />;
  }
}
