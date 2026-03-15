# Constructor Logic: Attribute-Based Routing

## Decision

Quiz routing uses an attribute accumulation model where answers contribute attribute values and transitions are conditioned on the user's accumulated profile.

## Context

The platform generates personalized wellness/lifestyle plans based on user responses. The routing logic needs to be flexible enough to handle complex branching while remaining understandable to admins.

## Design

1. **Attributes** are defined per quiz (e.g., age range, gender, goal, fitness level)
2. **Questions** are assigned relevant attributes from the quiz's attribute set
3. **Answer options** each specify attribute values that get added to the user's profile when selected
4. **Transitions** (edges) between questions can be conditional — the next question depends on the user's accumulated attribute values
5. **Finish blocks** terminate a branch and map to offers/plans based on the final attribute profile

## Flow

```
User starts quiz
  → Question displayed
    → User selects answer(s)
      → Attribute values accumulated
        → Transition conditions evaluated
          → Next question (or finish)
```

## Consequences

- Highly flexible branching — any combination of attributes can drive routing
- Admins must understand the attribute model to build effective flows
- The backend stores the graph structure; the frontend converts it to/from React Flow format for visual editing
