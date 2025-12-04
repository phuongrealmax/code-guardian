# CCG Process - Process Management

Manage ports and running processes.

## Usage

```
/ccg-process [action] [args]
```

## Actions

### list
List tracked processes:
- Call `process_list`
- Show running processes with ports

### check [port]
Check if port is available:
- Call `process_check_port` with port number
- Show process using port if occupied

### kill [pid|port]
Kill a process:
- Call `process_kill` with PID or port
- Confirm process terminated

### ports
Show all port usage:
- Call `process_ports_status`
- Display port map

## Instructions

When invoked:

1. If "list": Call `process_list`
2. If "check": Call `process_check_port`
3. If "kill": Call `process_kill`
4. If "ports": Call `process_ports_status`
5. If no action: Show list

Display formatted output with process info.
