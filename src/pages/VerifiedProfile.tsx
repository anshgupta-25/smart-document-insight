import {
  User, GraduationCap, Trophy, Code2, Wrench, FolderGit2, Award,
  MapPin, Calendar, ExternalLink
} from "lucide-react";

const profile = {
  name: "Ansh Gupta",
  education: [
    {
      institution: "Lovely Professional University",
      program: "GEN-AI",
      period: "2024–2028",
      score: "CGPA 8.20",
    },
    {
      institution: "Delhi Public School, Roorkee",
      program: "PCM",
      period: "School",
      score: "85%",
    },
  ],
  achievements: [
    "HackXlerate 2025 Finalist (Top 7 of 1000+)",
    "Google Cloud Arcade Legend (400+ labs, 50+ badges)",
    "500+ DSA problems (ByteXL)",
  ],
  skills: {
    languages: ["Python", "C++", "Java", "SQL", "JavaScript", "HTML/CSS"],
    frameworks: ["Flask", "FastAPI", "React", "Node.js", "Docker", "Kubernetes"],
    aiTools: ["LangChain", "Selenium", "Playwright", "Ollama"],
    cloud: ["Azure", "GCP", "Oracle Cloud", "Git", "CI/CD"],
  },
  projects: [
    "Web Navigator AI Agent",
    "Customer Service Chatbot",
    "Speech-to-Text Tool",
  ],
  certifications: [
    "Microsoft AI-900",
    "Microsoft AZ-900",
    "Oracle OCI AI Foundations",
    "Google Cloud Arcade",
    "HackerRank Python",
  ],
};

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function SkillBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground border border-border">
      {label}
    </span>
  );
}

export default function VerifiedProfile() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary shadow-glow shrink-0">
          <User className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">Verified Profile · Source of Truth</p>
        </div>
      </div>

      {/* Education */}
      <SectionCard icon={GraduationCap} title="Education">
        <div className="space-y-3">
          {profile.education.map((edu, i) => (
            <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium text-foreground">{edu.institution}</p>
                <p className="text-xs text-muted-foreground">{edu.program}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-mono text-primary">{edu.score}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  {edu.period}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Achievements */}
      <SectionCard icon={Trophy} title="Achievements">
        <ul className="space-y-2">
          {profile.achievements.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
              <span className="text-primary font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              {a}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Skills */}
      <SectionCard icon={Code2} title="Skills">
        <div className="space-y-4">
          {Object.entries(profile.skills).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {category === "aiTools" ? "AI & Automation" : category}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <SkillBadge key={skill} label={skill} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects */}
        <SectionCard icon={FolderGit2} title="Projects">
          <ul className="space-y-2">
            {profile.projects.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-secondary-foreground">
                <Wrench className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Certifications */}
        <SectionCard icon={Award} title="Certifications">
          <ul className="space-y-2">
            {profile.certifications.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-secondary-foreground">
                <Award className="w-3.5 h-3.5 text-primary shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
