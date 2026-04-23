# Matchflix Intelligence Manual: Neural Discovery Protocols

This manual defines the logic governing the Matchflix recommendation ecosystem. All suggestions are derived from a combination of psychological dimensions, personality archetypes, and temporal mood filters.

## 1. The 8 Neural Dimensions
Every film and user is mapped across 8 distinct cinematic axes (1.0 to 10.0):
- **Emotional Impact**: Degree of visceral/sentimental resonance.
- **Cinematography**: Visual craftsmanship and aesthetic depth.
- **Audio Design**: Sonic atmosphere and score integration.
- **Narrative Coherence**: Structural clarity vs. abstract complexity.
- **Moral Conflict**: Depth of ethical ambiguity and character dilemmas.
- **Thematic Depth**: Philosophical and conceptual layers.
- **Pacing**: Kinetic energy vs. slow-burn build-up.
- **Rewatch Value**: Discoverability of new layers upon repeated viewing.

## 2. Neural Distance Algorithm (Content-Based)
For a single user, recommendations are ranked using a weighted Euclidean distance:
$$Score = 100 - (\sqrt{\sum (UserDim_i - MovieDim_i)^2} \times 6)$$

### 2.1 Multipliers & Penalties
- **Genre Alignment**: Movies sharing the user's preferred genres (from `solo_sessions`) receive a **+15 boost** per matching genre. Movies with zero genre overlap receive a **-20 penalty**.
- **Mood Sync**: If a movie's `mood_tags` matches the user's active `mood_tag`, it receives a massive **+40 boost**.
- **MBTI Affinity**: Specific films have pre-calculated affinities for certain MBTI types (e.g., INTJs receive a boost for high *Thematic Depth* and *Narrative Coherence*).

## 3. Match Hub Blending (Dual-Neural Profile)
When matching two users, the engine creates a **Blended Neural Profile**:
1. **Dimension Blending**: The average of both users' weights is used as the target.
2. **Genre Union**: The pool includes genres preferred by *either* user.
3. **Conflict Minimization**: Dimensions where the users have a "Severe Disconnect" (Gap > 4) are highlighted in the UI, and the engine prioritizes films that occupy the "Safe Overlap" in those specific areas.

## 4. Discovery Diversity (Randomized Pooling)
To prevent repetitive suggestions:
- The engine fetches a randomized pool of **150-250 movies** from the 650+ catalog.
- Shuffling occurs *before* ranking, ensuring that even with the same profile, different "Neural Near-Matches" appear on every refresh.

## 5. Compatibility Archetypes
Match scores are mapped to specific archetypes:
- **90%+ : The Soulmates** (Perfect alignment across all core dimensions).
- **75%+ : The Visionaries** (Shared high standards for Cinematography/Themes).
- **45%+ : The Paradox** (Agreement on technicals but clash on emotions).
- **<25% : The Antagonists** (Cinematic opposites).
