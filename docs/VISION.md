# Tafy Studio Vision

## What is Tafy Studio?

Tafy Studio is a Robot Distributed Operation System (RDOS) that makes robotics accessible to makers, educators, and researchers.
It's designed to get you from blank hardware to a moving robot in 30 minutes or less.

## Core Beliefs

### 1. "I can go from blank device to a moving robot in ≤30 minutes"

**Why it matters:** The first experience shapes everything. When someone can see their robot move quickly, they're hooked. This creates a positive feedback loop that drives adoption and learning.

### 2. "I don't have to write drivers; hardware is plug-and-play"

**Why it matters:** Driver development is a time sink that adds no value to most users.
By providing a comprehensive driver ecosystem and automatic hardware discovery, we free developers to focus on behavior and applications.

### 3. "Nodes find each other and cluster automatically"

**Why it matters:** Modern robots are multi-board systems. Adding compute (like a Jetson for vision) should be as simple as powering it on. No manual configuration, no network debugging.

### 4. "I can build useful behaviors without code"

**Why it matters:** Visual programming democratizes robotics. Professionals can prototype faster, educators can focus on concepts rather than syntax,
and makers can achieve complex behaviors through composition.

### 5. "I can drop in AI without being an ML expert"

**Why it matters:** AI/ML capabilities should be accessible building blocks, not research projects. Pre-trained models and simple interfaces make intelligent behavior achievable for everyone.

### 6. "I can update and recover safely"

**Why it matters:** Robots in the field need reliable update mechanisms. Trust comes from knowing you can update without bricking devices and recover when things go wrong.

### 7. "I can try everything in simulation first"

**Why it matters:** Hardware is expensive and fragile. Simulation provides a zero-cost onboarding experience and enables development without physical robots.

### 8. "Local-first, cloud optional"

**Why it matters:** Your robots should work without internet connectivity. Cloud features should enhance, not gatekeep, core functionality.

## What Makes Tafy Studio Different?

### From Makers, For Makers

We've built countless robots and hit the same pain points repeatedly. Tafy Studio is the system we wish existed when we started.

### Distributed by Design

Modern robots aren't single-board computers with sensors—they're networks of specialized compute nodes. Tafy Studio embraces this reality with automatic clustering and workload distribution.

### Soft Real-Time is Good Enough

Not every robot needs microsecond precision. By targeting soft real-time performance (10-100ms latency),
we can use modern web technologies and container orchestration, dramatically simplifying development.

### Batteries Included, But Swappable

We provide opinionated defaults for everything—messaging, orchestration, UI, simulation—but you can swap any component.
Use our NATS messaging or bridge to ROS2. Deploy our flows or write custom code.

## Who is Tafy Studio For?

### Makers & Hobbyists

- Build robots without learning 5 different frameworks
- Share projects that others can actually reproduce
- Focus on the fun parts, not the plumbing

### Educators

- Get entire classrooms up and running in one session
- Visual programming for teaching concepts
- Simulation for schools without hardware budgets

### Researchers

- Prototype quickly with high-level abstractions
- Drop down to code when needed
- Reproducible experiments across different hardware

### Startups & Products

- Production-ready infrastructure from day one
- Scale from prototype to fleet
- Commercial-friendly Apache 2.0 license

## Design Principles

1. **Time to First Motion (TTFM) is Sacred**: Every decision should reduce the time to seeing a robot move
2. **Convention Over Configuration**: Smart defaults with escape hatches
3. **Graceful Complexity**: Simple things simple, complex things possible
4. **Offline First**: Core functionality works without internet
5. **Reproduce Everywhere**: What works on your desk works in the field

## The Future We're Building

Imagine a world where:

- Building a robot is like assembling LEGO—parts just work together
- Sharing a robot project is as simple as sharing a GitHub repo
- Every classroom can afford a robotics program
- Researchers spend time on algorithms, not infrastructure
- Small teams can build production robot fleets

This is the future Tafy Studio enables. Join us in making robotics accessible to everyone.
