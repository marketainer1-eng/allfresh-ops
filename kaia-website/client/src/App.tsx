import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import VisionPage from "./pages/VisionPage";
import LeadershipPage from "./pages/LeadershipPage";
import OrganizationPage from "./pages/OrganizationPage";
import HistoryPage from "./pages/HistoryPage";
import BusinessPage from "./pages/BusinessPage";
import ProgramPage from "./pages/ProgramPage";
import ContactPage from "./pages/ContactPage";
import PartnersPage from "./pages/PartnersPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/about"} component={AboutPage} />
      <Route path={"/vision"} component={VisionPage} />
      <Route path={"/leadership"} component={LeadershipPage} />
      <Route path={"/organization"} component={OrganizationPage} />
      <Route path={"/history"} component={HistoryPage} />
      <Route path={"/business"} component={BusinessPage} />
      <Route path={"/program"} component={ProgramPage} />
      <Route path={"/partners"} component={PartnersPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
