import About from "@/components/about";
import Hero from "@/components/hero";
import OWASP from "@/components/owasp";
import Pipeline from "@/components/pipeline";
import Research from "@/components/research";

export const metadata = {
  title: "VulnScope - Penetration Testing Pipeline",
  description:
    "Automated web app penetration testing pipeline that generates structured PDF reports.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <main
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(232,124,30,0.08), transparent 28%), linear-gradient(to bottom, rgb(8,10,12), rgb(13,16,20), rgb(8,10,12))",
        }}
      >
        <Hero />
        <About />
        <Pipeline />
        <Research />
        <OWASP />
      </main>
    </div>
  );
}