import {I18nProvider} from "@/lib/i18n";
import {StockSearchShell} from "@/components/stock-search-shell";

export default function HomePage() {
  return (
    <I18nProvider>
      <StockSearchShell />
    </I18nProvider>
  );
}
