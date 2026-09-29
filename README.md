# yushi

使用 Bun workspaces 和 Turborepo 管理的 Git 提交信息助手。

## 项目结构

```text
apps/
  cli/           # @yushi/cli：命令行入口
packages/
  core/          # @yushi/core：Mastra agent、DeepSeek 配置和 Git 工具
tsconfig.json    # 共享 TypeScript 配置
turbo.json       # 任务依赖与缓存配置
```

CLI 通过 `workspace:*` 依赖 core，core 直接导出 TypeScript 源码，
由 Bun 执行，无需单独构建。运行时依赖由各自的 workspace 声明。

## 安装与配置

使用 Bun 1.4.2，在仓库根目录执行：

```bash
bun install
cp .env.example .env
```

在根目录 `.env` 中设置 `DEEPSEEK_API_KEY`，也可以通过环境变量提供。
Bun 自动加载 `.env`；Turbo 的 dev 任务允许传递该环境变量。

## 运行

```bash
# 分析当前仓库暂存区
bun run dev

# 分析指定仓库的未暂存变更
bun run dev -- --repo /absolute/path/to/repo --unstaged
```

dev 是一次性命令，每次都会执行，不缓存模型响应。
workspace 的 dev 脚本从仓库根目录启动 Bun，确保根目录 `.env`、
默认仓库和相对 `--repo` 路径保持一致。

## 检查与构建

```bash
bun run typecheck
bun run build

# 在仓库根目录运行构建产物
bun apps/cli/dist/index.js --repo /absolute/path/to/repo
```

Turbo 按依赖顺序执行类型检查，并缓存检查结果和 `dist/**` 构建产物。
CLI 构建使用 Bun，依赖保留为外部导入；产物需要当前 workspace 及已安装的依赖，
不是独立可分发的二进制文件。

## 添加 workspace

在 `apps/*` 或 `packages/*` 创建目录和 `package.json`，内部依赖使用
`workspace:*`，然后运行 `bun install`。TypeScript 配置继承根目录
`tsconfig.json`；在包中定义 `build` 或 `typecheck` 脚本即可加入 Turbo 任务。
