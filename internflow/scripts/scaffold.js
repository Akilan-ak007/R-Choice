const fs = require('fs');
const path = require('path');

const dashboardRoutes = [
  'dashboard/company',
  'dashboard/alumni',
  'profile/links',
  'profile/resume',
  'applications',
  'reports',
  'jobs',
  'jobs/create',
  'jobs/manage',
  'applicants',
  'approvals',
  'students',
  'students/applied',
  'analytics',
  'users',
  'companies',
  'drives',
  'referrals',
  'settings'
];

const dashboardTemplate = (title) => `export default function ${title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>${title}</h1>
        <p>This section is currently under development.</p>
      </div>
      <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🚧</div>
        <h2 style={{ marginBottom: "var(--space-2)" }}>Coming Soon</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
          We're actively building out the R-Choice platform functionalities. 
          Check back later to see the completed ${title} module!
        </p>
      </div>
    </div>
  );
}
`;

const publicTemplate = (title) => `import Link from 'next/link';

export default function ${title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
      <div className="card" style={{ textAlign: "center", padding: "var(--space-8)", maxWidth: "500px", width: "90%" }}>
        <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🏢</div>
        <h2 style={{ marginBottom: "var(--space-2)" }}>Company Registration</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
          The external company onboarding pipeline is currently being developed. 
          Once live, HR partners will be able to submit their verification documents here.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: "inline-flex" }}>
          Return to Login
        </Link>
      </div>
    </div>
  );
}
`;

const baseDir = path.join(__dirname, '../src/app');
const dashboardDir = path.join(baseDir, '(dashboard)');

function createRoute(dir, routePath, templateFunc) {
  const dirPath = path.join(dir, routePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const titleParts = routePath.split('/');
  const formattedTitle = titleParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

  fs.writeFileSync(path.join(dirPath, 'page.tsx'), templateFunc(formattedTitle));
}

dashboardRoutes.forEach(r => createRoute(dashboardDir, r, dashboardTemplate));
createRoute(baseDir, 'register/company', publicTemplate);

console.log('Successfully scaffolded missing pages!');
