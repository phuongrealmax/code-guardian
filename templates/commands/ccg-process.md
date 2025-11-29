# CCG Process Management

Manage development server ports and processes.

## Commands

### List Processes
```
/ccg process list
```
Show all tracked processes and port usage.

### Check Port
```
/ccg process port <port>
```
Check if a port is available and what's using it.

**Examples:**
```
/ccg process port 3000
/ccg process port 8080
```

### Kill Process
```
/ccg process kill <port|pid>
```
Kill a process by port or PID.

**Examples:**
```
/ccg process kill 3000      # Kill process on port 3000
/ccg process kill --pid 1234  # Kill by PID
```

### Start Server
```
/ccg process start <command> [--port port] [--name name]
```
Start a tracked process.

**Examples:**
```
/ccg process start "npm run dev" --port 3000 --name "dev-server"
/ccg process start "npm run api" --port 8080 --name "api-server"
```

### Cleanup
```
/ccg process cleanup
```
Kill all CCG-spawned processes and release ports.

### Status
```
/ccg process status
```
Show process management status.

## Configured Ports

Default port assignments (from config):

| Name | Port | Purpose |
|------|------|---------|
| dev | 3000 | Development server |
| api | 8080 | API server |
| test | 9000 | Test server |

## Port Conflict Resolution

When a port is in use:

1. **Check what's using it:**
   ```
   /ccg process port 3000
   ```

2. **Kill if needed:**
   ```
   /ccg process kill 3000
   ```

3. **Or find available port:**
   CCG will suggest the next available port.

## Automatic Behavior

With `autoKillOnConflict: true`:
- CCG automatically kills conflicting processes
- Warning is shown before killing
- Only kills processes on configured ports

## Best Practices

1. **Use consistent ports** - Configure in `.ccg/config.json`
2. **Name your processes** - Easier to track
3. **Cleanup on exit** - CCG does this automatically
4. **Check before starting** - Avoid conflicts

## Troubleshooting

### Port still in use after kill
```bash
# Manual check
lsof -i :3000

# Force kill
kill -9 <pid>
```

### Zombie processes
```
/ccg process cleanup
```

---

When these commands are invoked, use the `process_*` MCP tools.
