# Distribution Roadmap v1

> Code Guardian Studio - Soft Launch Plan
> **Version**: 1.0
> **Last Updated**: December 2024

## Overview

This document outlines the distribution strategy for Code Guardian Studio's soft launch. The goal is to build initial traction through targeted outreach before broader marketing efforts.

**Current State**:
- Product: v4.0.0 (open-core architecture complete)
- Tech Debt Index: 68 (Grade D, improving)
- Core features: Code Optimizer, TDI tracking, Reports, MCP integration

---

## 1. Target Audiences

### Primary: Solo Developers

**Profile**:
- Individual developers working on side projects or freelance work
- Comfortable with CLI tools and Claude Code
- Value: time savings, code quality without hiring reviewers
- Budget: Free tier, occasional paid upgrades

**Pain Points**:
- No dedicated code review process
- Technical debt accumulates silently
- Hard to prioritize which files to refactor

**Message**: "Get AI-powered code review without the team overhead."

### Secondary: Tech Leads / Engineering Managers

**Profile**:
- Lead 3-15 person engineering teams
- Responsible for code quality and velocity
- Value: visibility into codebase health, onboarding efficiency
- Budget: Team tier ($19/seat/month)

**Pain Points**:
- Hard to quantify technical debt for stakeholders
- Code review bottlenecks
- New team members struggle with legacy code

**Message**: "Quantify tech debt. Track improvements over time."

### Tertiary: OSS Maintainers

**Profile**:
- Maintain popular open-source projects
- Deal with external contributions of varying quality
- Value: automated quality gates, contributor guidance
- Budget: Free tier (OSS discount programs)

**Pain Points**:
- Inconsistent code quality from contributors
- Time spent on manual reviews
- Documentation of complex codebases

**Message**: "Automated quality insights for your contributors."

---

## 2. Four-Week Soft Launch Plan

### Week 1: Personal Channels + Dev Communities

**Objective**: Validate messaging and gather initial feedback from known networks.

**Activities**:

| Day | Activity | Channel | Owner |
|-----|----------|---------|-------|
| 1 | Announce v4.0 release | Personal Twitter/X | Founder |
| 1-2 | Post in relevant Discord servers | Claude Code Discord, MCP community | Founder |
| 2-3 | Share on Hacker News (Show HN) | news.ycombinator.com | Founder |
| 3-4 | Reddit posts | r/programming, r/typescript, r/ClaudeAI | Founder |
| 5-7 | Respond to comments, collect feedback | All channels | Founder |

**Content to Create (Before Week 1)**:
- [x] README.md with quickstart
- [x] CHANGELOG.md with v4.0 release notes
- [ ] 2-minute demo video (terminal walkthrough)
- [ ] Twitter thread template (5-7 tweets)
- [ ] HN Show post draft

**Success Metrics**:
- 50+ GitHub stars
- 100+ npm installs
- 10+ feedback items collected

---

### Week 2: Affiliate Outreach

**Objective**: Recruit 5-10 initial partners to expand reach.

**Target Partners**:

| Type | Examples | Value Prop |
|------|----------|------------|
| Dev Educators | YouTube/Twitch streamers, course creators | Content opportunity, affiliate revenue |
| Newsletter Owners | Bytes, TLDR, JavaScript Weekly | Exclusive early access story |
| Tool Reviewers | DevHunt, Product Hunt launchers | Early review opportunity |
| Agency Owners | Freelance collectives, dev shops | Team productivity tool |

**Activities**:

| Day | Activity | Details |
|-----|----------|---------|
| 8-9 | Identify 20 potential partners | Research, list building |
| 9-10 | Personalized outreach (email/DM) | Custom pitch per partner |
| 10-12 | Follow-up and onboarding | Demo calls, affiliate setup |
| 12-14 | Partner content coordination | Review their drafts, provide assets |

**Content to Create (Before Week 2)**:
- [ ] Affiliate kit (logos, screenshots, copy snippets)
- [ ] Partner landing page or section
- [ ] Commission structure document
- [ ] Demo video for partner use

**Success Metrics**:
- 5 confirmed affiliate partners
- 2 scheduled content pieces (videos/posts)
- Affiliate tracking system live

---

### Week 3: OSS-Focused Distribution

**Objective**: Establish presence in developer tooling ecosystems.

**Activities**:

| Day | Activity | Platform |
|-----|----------|----------|
| 15-16 | GitHub profile optimization | Add topics, improve README badges |
| 16-17 | Submit to GitHub Actions Marketplace | PR comment action |
| 17-18 | Submit to VS Code Marketplace | Extension (when ready) |
| 18-19 | Create GitHub Discussions / Issues templates | Community engagement |
| 19-21 | Contribute to Claude Code ecosystem | MCP server registry, examples |

**GitHub Optimization Checklist**:
- [ ] Add relevant topics: `claude-code`, `mcp`, `code-quality`, `refactoring`
- [ ] Create CONTRIBUTING.md
- [ ] Add issue templates (bug, feature request)
- [ ] Set up GitHub Discussions
- [ ] Add Open Graph preview image

**Marketplace Submissions**:
- [ ] GitHub Actions: `ccg-action` for PR analysis
- [ ] VS Code: `codeguardian-studio` extension
- [ ] npm: Ensure package page is polished

**Success Metrics**:
- 200+ GitHub stars
- GitHub Action: 50+ workflow runs
- 10+ community discussions

---

### Week 4: Feedback Integration + Iteration

**Objective**: Process feedback and ship improvements.

**Activities**:

| Day | Activity | Output |
|-----|----------|--------|
| 22-23 | Aggregate all feedback | Prioritized issue list |
| 23-24 | Categorize: bugs, UX, features | Labeled GitHub issues |
| 24-25 | Quick wins: fix top 3 issues | Patch release (v4.0.1) |
| 25-26 | Document learnings | Internal retrospective |
| 26-28 | Plan next iteration | Updated roadmap |

**Feedback Sources**:
- GitHub issues
- Discord/community messages
- Email responses
- Affiliate partner feedback
- Usage analytics (if implemented)

**Key Questions to Answer**:
1. What's the #1 reason people don't install?
2. What's the #1 reason people uninstall?
3. Which feature gets the most positive feedback?
4. What's missing that would make Team tier compelling?

**Success Metrics**:
- 3+ issues resolved and released
- Internal retrospective document
- Clear priorities for Month 2

---

## 3. Asset-to-Channel Matrix

Maps which content assets are used in which distribution channels.

| Asset | Website | Email | Twitter | Video | Docs | Partners |
|-------|:-------:|:-----:|:-------:|:-----:|:----:|:--------:|
| **README.md** | - | - | - | - | Yes | Yes |
| **QUICKSTART.md** | - | - | - | - | Yes | Yes |
| **Demo video (2min)** | Yes | Yes | Yes | Yes | - | Yes |
| **Twitter thread** | - | - | Yes | - | - | - |
| **HN post** | - | - | - | - | - | - |
| **Case study** | Yes | Yes | - | - | Yes | Yes |
| **Affiliate kit** | - | - | - | - | - | Yes |
| **Screenshots** | Yes | Yes | Yes | - | Yes | Yes |
| **Logo/branding** | Yes | Yes | Yes | Yes | - | Yes |
| **Pricing page** | Yes | Yes | - | - | - | Yes |
| **Changelog** | - | Yes | - | - | Yes | - |
| **Migration guide** | - | - | - | - | Yes | - |

---

## 4. Assets Status

### Existing (Ready)

| Asset | Location | Status |
|-------|----------|--------|
| README.md | `/README.md` | Ready |
| Quickstart Guide | `/docs/QUICKSTART.md` | Ready |
| User Guide | `/docs/USER_GUIDE.md` | Ready |
| Changelog | `/CHANGELOG.md` | Ready |
| Migration Guide | `/docs/MIGRATION_OPEN_CORE.md` | Ready |
| License System Docs | `/docs/LICENSE_SYSTEM.md` | Ready |
| Case Study (dogfood) | `/docs/reports/case-study-*.md` | Ready |

### To Create (Week 1 Prep)

| Asset | Priority | Owner | Due |
|-------|----------|-------|-----|
| Demo video (2min terminal walkthrough) | High | Founder | Before W1 |
| Twitter thread template | High | Founder | Before W1 |
| HN Show post draft | High | Founder | Before W1 |
| Screenshots (3-5 key screens) | Medium | Founder | Before W1 |

### To Create (Week 2 Prep)

| Asset | Priority | Owner | Due |
|-------|----------|-------|-----|
| Affiliate kit (logos, copy, screenshots) | High | Founder | Before W2 |
| Partner landing page | Medium | Founder | Before W2 |
| Commission structure doc | High | Founder | Before W2 |

### Future (Post-Launch)

| Asset | Priority | Notes |
|-------|----------|-------|
| Pricing page | Medium | After validation |
| Comparison pages (vs SonarQube, etc.) | Low | SEO content |
| Video tutorials (10+ min) | Low | After core features stabilize |

---

## 5. Key Metrics Dashboard

Track these metrics weekly during soft launch:

### Acquisition

| Metric | W1 Target | W2 Target | W3 Target | W4 Target |
|--------|-----------|-----------|-----------|-----------|
| GitHub Stars | 50 | 100 | 200 | 300 |
| npm Installs (weekly) | 100 | 200 | 300 | 400 |
| Website Visitors | - | - | - | - |

### Engagement

| Metric | W1 Target | W2 Target | W3 Target | W4 Target |
|--------|-----------|-----------|-----------|-----------|
| GitHub Issues | 5 | 10 | 15 | 20 |
| Discord Members | 10 | 25 | 50 | 75 |
| Quickstart Completions | 20 | 50 | 100 | 150 |

### Revenue (Soft Targets)

| Metric | W1 Target | W2 Target | W3 Target | W4 Target |
|--------|-----------|-----------|-----------|-----------|
| Team Tier Signups | 0 | 1 | 3 | 5 |
| MRR | $0 | $19 | $57 | $95 |

---

## 6. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low initial traction | Medium | High | Focus on niche (Claude Code users) before broader |
| Negative HN feedback | Medium | Medium | Prepare response template, iterate quickly |
| Competitor launch | Low | Medium | Focus on MCP/Claude integration differentiator |
| Affiliate partner churn | Medium | Low | Over-recruit (10 partners for 5 target) |
| Feature requests overwhelm | High | Medium | Clear scope, link to roadmap |

---

## 7. Post-Launch Roadmap (Month 2+)

After soft launch, focus shifts based on feedback:

**If traction is strong (300+ stars, 5+ paying users)**:
- Scale affiliate program
- Prepare Product Hunt launch
- Develop landing page with testimonials

**If traction is moderate (100-300 stars, 1-5 paying users)**:
- Double down on content marketing
- Create more educational content
- Iterate on core UX based on feedback

**If traction is weak (<100 stars, 0 paying users)**:
- Revisit positioning and messaging
- Consider pivoting target audience
- Focus on technical improvements before marketing

---

## Appendix A: Message Templates

### Twitter Thread (Template)

```
1/ Shipped v4.0 of Code Guardian Studio - an AI-powered code refactor engine built on Claude Code.

2/ The problem: Technical debt is invisible until it's too late. You FEEL your codebase getting worse but can't quantify it.

3/ CCG gives you a Tech Debt Index (TDI) - a single number that tracks your codebase health over time.

4/ In our own dogfooding, we reduced TDI from 75 to 68 (-9.3%) by fixing 11 hotspots.

5/ It's open-core, fully offline for Dev tier, and integrates with Claude Code via MCP.

6/ Try it in 3 minutes:
npm install -g codeguardian-studio
ccg quickstart

7/ GitHub: [link]
Docs: [link]
```

### HN Show Post (Template)

```
Title: Show HN: Code Guardian Studio - AI-powered tech debt tracking for Claude Code

Body:
Hey HN,

I've been building Code Guardian Studio, an MCP server that adds code quality tooling to Claude Code.

The main feature is the Tech Debt Index (TDI) - a composite metric that tracks codebase health over time. It analyzes complexity, nesting depth, file sizes, and code smells to give you a single number (0-100, lower is better).

Key features:
- Hotspot detection (finds files that need attention)
- Before/after tracking across sessions
- Markdown reports for sharing with stakeholders
- 100% offline for Dev tier (no cloud dependency)

I've been dogfooding it on its own codebase. Started at TDI 75, now at 68 after refactoring the top hotspots.

Stack: TypeScript, MCP SDK, SQLite for local storage

Would love feedback on the approach. Does quantifying tech debt resonate with your workflow?

GitHub: [link]
Quickstart: npm install -g codeguardian-studio && ccg quickstart
```

---

## Appendix B: Affiliate Commission Structure (Draft)

| Tier | Commission | Duration | Notes |
|------|------------|----------|-------|
| Standard | 20% | 12 months | Default for all partners |
| Premium | 30% | 12 months | 10+ conversions/month |
| Enterprise | Custom | Negotiated | Large accounts, custom deals |

Payment terms: Monthly, NET 30, minimum $50 payout threshold.

---

*This is a living document. Update after each week's retrospective.*
