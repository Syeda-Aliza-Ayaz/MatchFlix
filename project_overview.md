# Matchflix Project Base Overview

This document provides a thorough analysis of the project's evolution, from its relational database foundations to its high-fidelity cinematic frontend.

## Project Summary
Matchflix is a psychological movie recommendation and compatibility engine. Instead of using standard "1-5 star" ratings, it decomposes movie appreciation into 8 distinct psychological dimensions:
1.  **Emotional Impact**
2.  **Cinematography**
3.  **Audio Design**
4.  **Narrative Coherence**
5.  **Moral Conflict**
6.  **Thematic Depth**
7.  **Pacing**
8.  **Rewatch Value**

The engine maps users onto a "Cinematic Pulse," calculated through a specialized **Onboarding Sequence**, and identifies matches based on deep psychological alignment.

## Current Technical Stack

### 🚀 Frontend (Next.js)
Located in `/frontend`.
- **Framework**: Next.js 16.2.3 (Turbopack) with TypeScript.
- **Styling**: Vanilla CSS + Tailwind v4 for utility-based transitions.
- **Ambience**: Global layers including `FilmGrain`, `CustomCursor`, and `HeroBackground` particles.
- **Animations**: `framer-motion` for complex UI transitions and decoder text effects.

### 🔐 Authentication & Identity
- **Firebase Auth**: Managed via `useAuth.ts` hook. Supports Google Sign-In and Email/Password flows.
- **Onboarding Sequence**: A 10-step psychological questionnaire that initializes the user's `user_dimension_weights` and `mood_tag`.
- **State Persistence**: Currently using `LocalStorage` (`matchflix_profile`) for instantaneous UI updates and offline development, with pre-planned routes for Firestore/Oracle migration.

### 🏛️ Database & Data Layer
- **SQL (`/sql`)**: Master Oracle SQL schema defining `USERS`, `MOVIES`, `GENRES`, and `USER_RATINGS`.
- **Ingestion (`/scripts`)**: Python scripts (`load_movies.py`) for processing TMDB datasets and seeding users.
- **Data (`/data`)**: TMDB 5000 dataset (Movies/Credits).

## Directory Structure Highlights
*   `frontend/src/app`: Root of the Next.js App Router (Dashboard, Onboarding, Auth, Profile).
*   `frontend/src/components`: UI components (MovieCard, RadarChart, Navbar).
*   `frontend/src/hooks`: Global logic controllers (`useAuth`).
*   `frontend/src/lib`: External integrations (`firebase.ts`).

## Phase VII: The Augmented Matrix (Current)
We have successfully transitioned to a data-driven cinematic experience.
- **TMDB Integration**: Metadata and credits merged into a 150-film `movieCatalog.ts`.
- **Interaction Model**: 3D Matrix Flip cards for immediate narrative access.
- **Dynamic Environments**: Genre-responsive background systems (Sci-Fi Grid, Action Scanlines, etc.).
- **Calibration System**: Live psychological depth mapping and rating persistence via LocalStorage.

## Architecture Roadmap
1.  **Phase VIII (Next)**: Backend Re-integration. Migrating `LocalStorage` payloads to the Oracle SQL / Firebase layer now that the UI is finalized.
2.  **Phase IX**: Global Compatibility. Implementing the pairwise matching algorithm for social discovery.
