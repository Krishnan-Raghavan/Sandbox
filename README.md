# Sandbox

A personal playground for learning and research — trying out new languages,
tools, and ideas outside the pressure of a "real" project.

## Structure

Organized by programming language. Each language folder splits `projects/`
(standalone apps/tools worth revisiting) from `exercises/` (tutorials,
katas, course work, throwaway practice).

```
Sandbox/
├── python/
│   ├── projects/
│   ├── notebooks/      # exploratory/research notebooks
│   └── exercises/
├── typescript/
│   ├── projects/
│   └── exercises/
├── javascript/
│   ├── projects/
│   └── exercises/
├── go/
│   ├── projects/
│   └── exercises/
├── java/
│   ├── projects/
│   └── exercises/
├── c/
│   ├── projects/
│   └── exercises/
├── cpp/
│   ├── projects/
│   └── exercises/
├── databases/           # organized by engine
│   ├── postgresql/
│   ├── mysql/
│   ├── mongodb/
│   ├── redis/
│   ├── sqlite/
│   └── firebase/
│       ├── projects/
│       └── exercises/
└── misc/                 # multi-language / full-stack projects and
                           # cross-language experiments that don't fit
                           # a single language folder
```

## Conventions

- Each leaf folder (`projects/`, `exercises/`, or a database engine folder)
  holds independent, self-contained pieces of work — one subfolder per
  topic or project, with its own dependency manifest (`package.json`,
  `requirements.txt`, `go.mod`, etc.).
- Dependencies, build output, and environment files are not committed —
  see `.gitignore`. Reinstall from each project's manifest as needed.
- New languages or database engines get a new top-level folder following
  the same `projects/`/`exercises/` split.

## License

MIT — see [LICENSE](LICENSE).
