# Luneva-Platform: workflow между двумя компьютерами

- `upstream` указывает на GitHub и является кандидатом на канонический remote.
- `origin` сейчас указывает на локальный transfer bundle и не подходит для двусторонней синхронизации.
- Локальный `master` имеет значительное расхождение с `upstream/master`, а рабочее дерево содержит незакоммиченные изменения.
- До ручного review/reconciliation запрещены pull, merge, rebase, reset и изменение remotes.
- Безопасно: `git fetch upstream --prune`, `git status --short --branch`, сравнение логов и diff.
- Commit/push выполняются только по явному разрешению после проверки секретов и выбора целевой GitHub-ветки.
- Production deploy, production data и серверные конфигурации не изменять в рамках синхронизации рабочих мест.
