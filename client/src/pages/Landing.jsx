import { Link, Navigate } from "react-router-dom";
import { Code2, Users, Video, ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { Container, Card, Button } from "../components/ui";
import { useAuthStore } from "../store/authStore.js";

const FEATURES = [
  {
    icon: Users,
    title: "smart matching",
    body: "scored on topics, level, language, and availability. no random pairings or wasted sessions.",
  },
  {
    icon: Video,
    title: "live video + voice",
    body: "1:1 webrtc calls, peer-to-peer encrypted. no accounts to add. just match and start.",
  },
  {
    icon: Code2,
    title: "collaborative editor",
    body: "monaco editor with real-time sync. shared cursors, language switching, problem statements inline.",
  },
];

const STEPS = [
  "create your profile (target role, skills, when you're free)",
  "click find a peer, get matched in seconds",
  "solve a real interview problem together over video + shared editor",
  "review the session and code anytime in your history",
];

export default function Landing() {
  const { user, loading } = useAuthStore();
  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at top, rgb(99 102 241 / 0.18), transparent 60%)",
          }}
        />
        <Container size="lg" className="pt-16 md:pt-28 pb-16 md:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              built for engineers prepping for faang interviews
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              practice interviews with{" "}
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                real peers
              </span>
              , not bots.
            </h1>
            <p className="mt-6 text-lg text-zinc-400 max-w-2xl">
              get matched with someone at your level. share a real video call and a real code editor. solve interview problems the way you'll actually do them on the day.
            </p>
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Link to="/signup">
                <Button size="lg">
                  start matching <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">i have an account</Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> free
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> no card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> works in your browser
              </span>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-zinc-900">
        <Container size="lg" className="py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="p-6">
                <div className="h-9 w-9 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-zinc-100">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-zinc-900">
        <Container size="md" className="py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">how it works</h2>
          <ol className="mt-8 space-y-4">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-zinc-300 pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Link to="/signup">
              <Button size="lg">
                get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      <footer className="border-t border-zinc-900">
        <Container size="lg" className="py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500">
            peerprep · built for practicing engineers
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <Link to="/login" className="hover:text-zinc-300">login</Link>
            <Link to="/signup" className="hover:text-zinc-300">signup</Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
