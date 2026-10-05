# Kubernetes: One Pod disappears. Who brings it back?

English narration, titles and captions. Vertical 1080x1920, 30 fps. Target 60-75 seconds. Audience: junior developers. User delegated all production decisions and subsequently specified English only.

Promise: explain reconciliation through one deleted managed Pod. Native schematic animation, not a recording of a live cluster. No guaranteed instant recovery or zero downtime claim.

## One Pod disappears. Who brings it back?

Delete one Pod. Who brings your app back? Here's Kubernetes in one minute.

Visual: hook. Sources: deployment, healing.

## You declare it. Kubernetes maintains it.

Imagine your web app needs three copies. Set three replicas in a Deployment. Each copy runs in a Pod, which contains your application container.

Visual: declare. Sources: deployment, healing.

## Desired: three. Actual: two.

Now one of those Pods is deleted. The ReplicaSet controller notices the gap: you want three, but only two remain.

Visual: observe. Sources: deployment, healing.

## Notice the gap. Create a new Pod.

It creates a replacement Pod. The scheduler picks a suitable node, and the kubelet starts its containers. That loop is called reconciliation.

Visual: replace. Sources: deployment, healing.

## Pods change. The address stays.

But clients need a stable address. A Service routes traffic to ready Pods. The replacement joins when it's ready.

Visual: service. Sources: service.

## Self-healing. Not magic.

Recovery takes time and available resources. Kubernetes won't fix broken application code.

Visual: limits. Sources: deployment, healing.

## Declare the goal. Keep closing the gap.

You declare the desired state. Kubernetes keeps working toward it. Try three replicas in a test cluster, then delete one Pod and watch.

Visual: takeaway. Sources: deployment, healing.
