# Pricing Details

> Source copy for pricing section and comparisons
> Last Updated: December 2024 (v4.0.0)

## Tier Comparison

| Feature | Dev (Free) | Team ($19/mo) | Enterprise (Custom) |
|---------|:----------:|:-------------:|:-------------------:|
| **Core CLI** | Yes | Yes | Yes |
| **Hotspot detection** | Yes | Yes | Yes |
| **Tech Debt Index per run** | Yes | Yes | Yes |
| **Basic markdown reports** | Yes | Yes | Yes |
| **GitHub Actions template** | Yes | Yes | Yes |
| **Fully offline operation** | Yes | Yes | Yes |
| **No license required** | Yes | - | - |
| **Advanced reports (before/after)** | - | Yes | Yes |
| **TDI trends & session history** | - | Yes | Yes |
| **Multi-repo config** | - | Yes | Yes |
| **PR hotspot comments** | - | Yes | Yes |
| **VS Code extension** | - | Yes | Yes |
| **Email support** | - | Yes | Yes |
| **Unlimited repos** | - | - | Yes |
| **SSO / SAML** | - | - | Yes |
| **Audit logs** | - | - | Yes |
| **Dedicated cloud backend** | - | - | Yes |
| **SLA + dedicated support** | - | - | Yes |

---

## Dev Tier (Free)

**Target**: Solo devs & side projects

**What's included**:
- Core CLI (`ccg quickstart`, `ccg code-optimize`)
- Hotspot detection and ranking
- Tech Debt Index (0-100, grade A-F) per run
- Basic markdown reports in `docs/reports/`
- GitHub Actions template for CI
- Fully local operation, no cloud dependency
- No license key required

**Limitations**:
- No trend tracking across sessions
- No before/after comparisons
- No PR comments

**Best for**:
- Individual developers
- Side projects
- OSS maintainers (basic quality checks)
- Evaluating CCG before team adoption

---

## Team Tier ($19/month)

**Target**: Product teams & agencies

**Everything in Dev, plus**:
- Advanced reports with before/after comparisons
- TDI trend charts and session history
- Multi-repo configuration for monorepos
- PR hotspot comments via GitHub Action
- VS Code extension (status bar TDI, hotspot navigation)
- Email support (1 business day response)

**Best for**:
- 3-15 person engineering teams
- Agencies managing multiple client codebases
- Teams wanting visibility into tech debt progress
- Organizations with CI/CD pipelines

---

## Enterprise Tier (Custom)

**Target**: Large orgs & compliance requirements

**Everything in Team, plus**:
- Unlimited repositories
- SSO / SAML integration
- Audit logs for compliance
- Dedicated cloud backend (your own tenant)
- SLA with guaranteed uptime
- Dedicated support with assigned account manager
- Custom integrations available

**Best for**:
- Enterprise organizations (50+ engineers)
- Regulated industries (SOC2, HIPAA, etc.)
- Organizations requiring SSO/SAML
- Custom deployment requirements

---

## FAQ: Pricing

### Why is Dev tier free with no limits?
We believe core code quality tooling should be accessible to everyone. The Dev tier is genuinely free — not a trial, not limited to small projects. It runs 100% offline with no license key.

### What happens if I exceed limits on Team?
Team tier has no artificial file or repo limits. The "multi-repo config" feature supports as many repos as you need. The only difference from Enterprise is SSO, audit logs, and dedicated support.

### Can I try Team features before paying?
Contact us at hello@codeguardian.studio for a 14-day trial of Team features.

### Do you offer discounts for OSS projects?
Yes! Active OSS maintainers can get Team tier at 50% off. Email hello@codeguardian.studio with a link to your project.

### What payment methods do you accept?
Team tier: Credit/debit card via Stripe
Enterprise: Invoice with NET 30 terms available

---

## Comparison: CCG vs SonarQube + Claude

| Aspect | CCG | SonarQube + Claude |
|--------|-----|-------------------|
| **Setup time** | 1 command | Hours (SonarQube server, config) |
| **Tech Debt Index** | Built-in (0-100) | Manual calculation |
| **Trend tracking** | Built-in | Manual or third-party |
| **Claude integration** | Native MCP | Manual prompt engineering |
| **Offline operation** | Yes (Dev tier) | SonarQube requires server |
| **Price (solo dev)** | Free | SonarQube Community Edition free, but server overhead |
| **Price (team of 10)** | $19/mo | $150+/mo (SonarQube Developer Edition) |

### When SonarQube makes sense
- You need deep static analysis with 1000s of rules
- You're already invested in the SonarQube ecosystem
- You need SonarLint IDE integration

### When CCG makes sense
- You want a single number (TDI) for codebase health
- You want trend tracking without setup overhead
- You're already using Claude Code
- You value offline-first, CLI-native tooling
