# Designing resilient software systems

Every system has two personalities.

The first appears in demos. It is quick. Calm. Almost suspiciously cooperative.

The second appears when a database slows down, a queue fills up, and traffic suddenly triples because somebody launched a campaign without mentioning it.

That second personality is the real system.

Resilience is the ability to keep delivering useful service when parts of that system misbehave. It is not the promise that nothing will fail. Things will fail. Networks sulk. Disks fill. Certificates expire. Humans deploy configuration at adventurous times.

A resilient design expects this.

It limits the damage. It stays understandable. It recovers without requiring a wizard, three shell scripts, and the original developer’s personal phone number.

This guide explores the practical habits behind that kind of software.

## Resilience is not the same as availability

Availability is an outcome. Resilience is how the system behaves while trying to achieve it.

A service can return HTTP 200 and still be useless. It may show stale information as current. It may accept an order and quietly lose the event that starts fulfilment. It may keep responding while a backlog grows into tomorrow’s incident.

Start by defining what **useful service** means.

For an order platform, it might mean:

- Customers can place valid orders.
- Accepted orders are never silently lost.
- Payment status eventually becomes correct.
- Optional recommendations may disappear during trouble.
- Operators can find and repair incomplete workflows.

That definition creates priorities.

Not every feature needs the same availability. Checkout matters more than recently viewed products. Device safety matters more than analytics upload. A medical alarm matters more than a dashboard animation, even if the animation is very tasteful.

Write service-level objectives around user outcomes. Then design the system to protect them.

<note heading="A useful starting question">
When the system is partially broken, what is the smallest honest service it can still provide?
</note>

The word “honest” matters. A degraded response should not pretend to be complete. Mark stale data. Explain delayed processing. Give the user a reliable next step.

## Begin with failure stories

Architecture often starts with the happy path.

A request arrives. A service processes it. A database saves it. An event is published. Everyone goes for lunch.

Now tell the unhappy version.

- The database commits, but the response is lost.
- The event broker accepts a message twice.
- The payment provider takes twenty seconds to answer.
- One availability zone disappears.
- A consumer crashes after performing the side effect but before acknowledging the message.
- A deployment changes a field that an older consumer still expects.

These are **failure stories**. They are more useful than saying “the system should be highly available.”

For each story, ask:

1. What does the user experience?
2. Which data may be wrong or incomplete?
3. Can the operation be retried safely?
4. How does the system recover?
5. How does an operator know recovery is needed?

The answers expose missing design decisions.

They also reveal where resilience is too expensive. That is allowed. Architecture is not a competition to eliminate all risk. It is a way to choose risk with open eyes.

## Put strict limits around waiting

Distributed systems spend a surprising amount of time waiting for one another.

Waiting consumes resources. Threads remain occupied. Connections remain open. Queues grow. A slow dependency quietly turns into a capacity problem.

Every remote call needs a timeout.

Not a timeout copied from a framework example. A timeout based on the end-to-end promise.

Suppose an API should respond within one second. It calls three dependencies. Giving every dependency a one-second timeout does not create a one-second API. It creates optimism with decimals.

Divide the time budget.

Reserve time for local work. Reserve time for a fallback. Pass deadlines downstream when possible. Stop work that can no longer produce a useful response.

Retries need limits too.

A retry can recover from a brief network problem. It can also multiply load on a service that is already struggling.

Use retries only when:

- The failure is likely temporary.
- The operation is idempotent.
- The request still has time left.
- The dependency has capacity to recover.

Add exponential backoff. Add jitter. Jitter keeps thousands of clients from retrying in perfect formation like a marching band of doom.

Do not retry validation failures. Do not retry authentication failures. Do not retry a request forever because the error message looked unfriendly.

## Make repeated work safe

Users retry.

Browsers retry. Proxies retry. Message brokers retry. Operators retry while saying, “Let us see what happens.”

The system must assume that the same intent can arrive more than once.

For commands such as creating a payment or submitting an order, accept an idempotency key. Store it with the result. When the same key returns, provide the original result instead of performing the side effect again.

The key needs a scope and lifetime. A payment key may be unique per merchant. An order key may belong to one customer session. Retaining every key forever is safe but eventually becomes its own storage strategy.

Message consumers need similar protection.

They can store processed message identifiers. They can make state transitions conditional. They can use natural business keys. The exact method changes. The principle does not.

<highlight>Delivery may happen more than once. The business effect should not.</highlight>

Be precise with state transitions.

Changing an order from `Pending` to `Paid` is different from setting it to `Paid` from any state. The first can reject stale or impossible updates. The second can quietly erase history.

Optimistic concurrency helps here. Update only the version you read. If another operation changed it, stop and reconsider.

Conflicts are not always errors. Sometimes they are information.

## Separate critical work from optional work

One struggling feature should not consume the entire system.

This sounds obvious. It is surprisingly easy to ignore.

Imagine that image processing, invoice generation, search indexing, and customer notifications all share one worker pool. A burst of large images can delay invoices. Search jobs can delay emails. Everything is technically asynchronous. Everything is also standing in the same queue.

Use bulkheads.

Separate worker pools, queues, connection pools, and concurrency limits when workloads have different priorities or failure patterns. The name comes from ships. One flooded compartment should not sink the whole vessel. Software enjoys borrowing nautical wisdom because servers are terrible swimmers.

Protect critical paths first.

- Reserve database connections for interactive traffic.
- Give payment callbacks their own queue.
- Limit expensive report generation.
- Isolate partner integrations.
- Stop optional background work during overload.

This is also where graceful degradation becomes useful.

If recommendations fail, hide them. If live inventory is unavailable, show a clear temporary message. If a profile image cannot load, use initials. If a fraud decision is mandatory, do not guess.

Fallbacks must preserve correctness.

A cached price from five minutes ago may be fine for a dashboard. It may be unacceptable for a trade. “Use the cache” is not a resilience strategy until freshness and business risk are defined.

## Apply backpressure before the queue becomes a museum

Queues are helpful. They absorb bursts. They separate producers from consumers. They also make overload look calm for a while.

That last part is dangerous.

If work arrives faster than it can be processed, the queue grows. Latency grows with it. Eventually the system is processing requests that nobody cares about anymore.

Measure queue age, not only queue depth.

Ten thousand tiny jobs may be healthy. Fifty jobs waiting six hours may not be.

Backpressure tells producers that the system is full.

It can take several forms:

- Reject new work with a clear retry signal.
- Slow producers.
- Reduce concurrency.
- Drop low-priority work.
- Coalesce repeated updates.
- Sample noncritical telemetry.

Load shedding can feel rude. It is often kinder than accepting work that cannot finish.

A fast, honest rejection protects existing users. A slow, dishonest acceptance creates mystery.

Define capacity limits before production discovers them for you. Test what happens at the boundary. Watch whether the system recovers when traffic falls.

Recovery matters as much as survival.

## Make failure visible in business language

Resilient systems explain themselves.

CPU graphs and memory charts help. They do not explain why customers cannot finish checkout.

Track signals that describe the actual workflow.

For an order system:

- Orders attempted per minute.
- Orders accepted.
- Payments awaiting confirmation.
- Duplicate requests prevented.
- Age of the fulfilment backlog.
- Orders requiring reconciliation.

Use metrics for trends. Use structured logs for decisions. Use traces for journeys across services.

Carry one correlation identifier through the workflow. Include business identifiers carefully. Avoid sensitive data. An operator should be able to move from an alert to the affected operation without searching the digital equivalent of a haystack factory.

Alerts should be actionable.

“Error count is 143” is a fact.

“Payment confirmation delay exceeds ten minutes; provider latency is elevated; reconciliation is active” is a situation.

Attach a runbook. Name the owner. Explain the safe actions. If the alert requires tribal knowledge, the tribe will eventually be asleep.

## Design recovery as a feature

Backups are comforting.

Restores are useful.

Test the restore.

Know the recovery point objective. That is how much data loss the business can tolerate. Know the recovery time objective. That is how long recovery may take.

Do not choose these numbers from a cloud product page. Choose them with the people who understand the consequence.

A fifteen-minute recovery point may be harmless for analytics. It may be a catastrophe for accepted payments.

Recovery also includes application workflows.

Build reconciliation jobs. Build replay tools. Make administrative actions auditable. Let operators resume stuck work without editing database rows by hand.

Keep repair operations idempotent. The day is already difficult. Recovery tooling should not add surprise fireworks.

Practice failure.

Run game days. Disable a dependency. Add latency. Fill a queue. Rotate a credential. Restore a backup into an isolated environment. Watch the team, not only the software.

You will find missing permissions, unclear dashboards, outdated documentation, and alerts that point bravely toward nowhere.

That is success.

Finding those gaps during a planned exercise is much cheaper than discovering them during an incident.

## Keep the design understandable

Complexity is not resilience.

Sometimes redundancy helps. Sometimes another service helps. Sometimes a simpler system with a clear recovery path is safer than a distributed masterpiece.

Every mechanism has a cost.

Retries add load. Caches add staleness. Queues add delay. Replicas add consistency questions. Circuit breakers add states. Multi-region systems add an exciting collection of clocks, networks, and invoices.

Use the smallest mechanism that addresses the real failure story.

Record important decisions in Architecture Decision Records. Explain the context. Explain the trade-off. Explain when the decision should be revisited.

Design for the next engineer.

Keep the critical path visible. Use names that reveal intent. Automate invariant checks. Make dashboards discoverable. Keep runbooks close to alerts.

A system that only its original author can recover is not resilient. It is haunted.

## A resilience review that fits on one page

Before shipping an important workflow, ask:

- What is the useful degraded service?
- Which failures are expected?
- Does every remote call have a justified timeout?
- Which operations may be retried?
- Are repeated requests safe?
- Can one workload exhaust shared resources?
- Where does backpressure begin?
- Which work can be dropped?
- How old can cached data be?
- Can operators identify affected users or entities?
- Can incomplete workflows be reconciled?
- Have backup restores been tested?
- Has the team practised the failure?

Short questions can uncover very long incidents.

## The calm system wins

Resilience does not come from one pattern.

It comes from many small, honest decisions.

Set limits around waiting. Retry carefully. Make repeated work safe. Isolate critical resources. Push back before overload becomes collapse. Observe business outcomes. Build recovery paths. Practise using them.

Most of all, accept that failure is part of normal operation.

The goal is not a system that never has a bad day.

The goal is a system that has a bad day without making it everybody’s bad day.

That is resilient architecture.

Calm. Legible. Repairable.

And pleasantly boring when the pager wakes up.
