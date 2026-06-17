# Nonogarm Playable Prototype Design

## Goal

Build the first playable version of Nonogarm: a neobrutalist browser game where solving nonogram patches reveals pieces of a hidden actor portrait, letting the player guess the actor for score. This version prioritizes a complete game loop, strong visual identity, and code boundaries that make a later puzzle-engine upgrade straightforward.

## Approved Direction

Use the Arcade Split layout inspired by the supplied reference image:

- Left side: title banner, compact status/menu rail, active nonogram board, and puzzle tools.
- Right side: blurred actor portrait, clickable 4x4 patch overlay, revealed image patches, free-text actor guess input, and scoring HUD.
- Mobile: the same functional pieces stacked into a compact vertical flow.

The first version uses generated placeholder actor portraits and data. Real actor photos can replace those entries later without changing the core UI flow.

## Core Game Loop

1. A round starts with a hidden generated actor portrait.
2. The portrait is divided into a 4x4 patch grid.
3. The player freely chooses any unrevealed patch.
4. Outer patches launch 5x5 nonograms.
5. The four center patches launch 8x8 nonograms.
6. Solving a nonogram reveals that exact patch as a crisp image slice over the blurred portrait.
7. The player can guess the actor at any time with forgiving free-text matching.
8. A correct actor guess ends the round and awards a final score.
9. The player can start a new round with another placeholder actor.

## Puzzle Interaction

The active board supports:

- Fill mode.
- Cross mode.
- Cell toggling by click or tap.
- Undo for recent cell changes.
- Clear for the current patch board.
- Row and column clues generated from the puzzle solution.
- Submit/check behavior when the board matches the solution.

Incorrect cell states can be corrected. Mistakes do not fail the puzzle immediately, but incorrect submit attempts count against score.

## Patch Rules

The 4x4 portrait grid uses zero-based positions internally. Patch difficulty comes from position:

- Center cells: rows 1-2 and columns 1-2, size 8x8.
- All other cells: size 5x5.

Revealed patches remain visible for the rest of the round. Solved patch data is stored separately from the actor data so the later puzzle engine can replace starter puzzles without changing reveal state.

## Actor Guessing

Actor guesses are free text with forgiving matching:

- Case-insensitive.
- Accent-insensitive.
- Ignores punctuation and repeated whitespace.
- Accepts aliases stored on the actor entry.

For generated placeholder actors, each entry still has a fictional display name, aliases, difficulty label, and difficulty multiplier. Later real actor entries can use the same shape.

## Scoring

Time affects both nonogram scoring and actor scoring.

Nonogram solve score:

```text
grid base points - solve time penalty - wrong submit penalty
```

Suggested starting values:

- 5x5 base: 250 points.
- 8x8 base: 650 points.
- Solve time penalty: 3 points per second for the active patch.
- Wrong submit penalty: 75 points each.
- Minimum patch score: 50 points.

Actor guess score:

```text
(difficulty base + hidden patch bonus + speed bonus) * actor difficulty multiplier
```

Suggested starting values:

- Difficulty base: 800 points.
- Hidden patch bonus: 120 points per unrevealed patch.
- Speed bonus: max(0, 900 - total round seconds * 8).
- Actor difficulty multipliers: Easy 1.0, Medium 1.4, Hard 1.8.

The HUD shows total score, elapsed time, revealed patch count, active puzzle size, current actor difficulty, and speed bonus context.

## Data Model

Actor entries should include:

- `id`
- `displayName`
- `aliases`
- `difficulty`
- `difficultyMultiplier`
- `portrait`
- `patches`

Patch entries should include:

- `row`
- `col`
- `size`
- `solution`
- `status`
- `startedAt`
- `solvedAt`
- `wrongSubmits`

Round state should include:

- active actor id
- selected patch id
- elapsed round time
- score
- revealed patch ids
- current board marks
- undo stack
- game status
- guess feedback

## Components

Use a small component split rather than one giant page component:

- `GameShell`: owns round state and composes the screen.
- `HeaderBanner`: title and short game promise.
- `StatusRail`: level, streak, difficulty, and secondary navigation-style blocks.
- `NonogramBoard`: clue labels, cells, and board interactions.
- `PuzzleControls`: fill, cross, undo, clear, submit/check.
- `PortraitReveal`: blurred portrait, patch grid, solved patch overlays, and selected patch state.
- `GuessPanel`: free-text input, Guess button, and feedback.
- `ScoreHud`: score, time, revealed count, current puzzle size, and speed bonus.

Helper modules:

- puzzle clue generation and solution comparison.
- text normalization and actor matching.
- score calculations.
- placeholder actor data.

## Visual System

The UI should use neobrutalist styling:

- Bold black borders.
- Offset black shadows.
- Bright cyan, pink, yellow, lime, orange, and white surfaces.
- Squared or lightly rounded boxes, no soft card-heavy marketing layout.
- Large heavy title type.
- Monospace or mono-like text for controls and HUD.
- Icons in action buttons where useful, using the project icon library.

The page should feel like a real game screen immediately, not a landing page.

## Error Handling And Edge Cases

- If no patch is selected, the board area prompts the player to select a patch.
- Solved patches cannot be selected again.
- Guessing an empty string shows a lightweight feedback message.
- Incorrect guesses do not end the round.
- Once the actor is guessed, puzzle controls are disabled until a new round starts.
- Score calculations clamp negative patch results to the minimum patch score.

## Testing And Verification

Verify the first version with:

- Build or lint command supported by the repo.
- Manual browser run of the core loop.
- Desktop layout visual check against the Arcade Split reference direction.
- Mobile viewport check for stacked layout.
- Interaction checks for patch selection, board marking, undo, clear, solve reveal, wrong guess, correct guess, and new round.

## Out Of Scope For This Prototype

- Real actor photos.
- Repository-wide puzzle generation and solver logic.
- Persistent player profiles or backend leaderboards.
- Full scores/settings/stats pages.
- Daily challenge scheduling.

The later puzzle-engine phase should replace or extend starter puzzle data generation while preserving the game shell, scoring, reveal, and guess flow.
