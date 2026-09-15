package api

import (
	"net/http"
	"strings"
)

// corsMiddleware adds permissive CORS headers so ray (localhost:3000) can call brain (localhost:3100).
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// NewRouter builds and returns the brain HTTP router.
func NewRouter() http.Handler {
	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("/health", healthHandler)

	// Models
	mux.HandleFunc("/v1/models", modelsHandler)

	// Chat (streaming SSE — for ray web)
	mux.HandleFunc("/v1/chat", chatStreamHandler)

	// Chat TUI (streaming SSE in TUI mode — for cohen)
	mux.HandleFunc("/v1/chat/tui", chatTUIHandler)

	// Approval back-channel — frontend POSTs here to resolve pending approvals
	mux.HandleFunc("/v1/chat/approve", approveHandler)

	// Agent
	mux.HandleFunc("/v1/agent", agentHandler)
	mux.HandleFunc("/v1/agent/autonomous", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			autonomousStatusHandler(w, r)
		case http.MethodPost:
			autonomousHandler(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Settings (autonomous mode, deployment directory)
	mux.HandleFunc("/v1/settings", settingsHandler)

	// Standalone title generation
	mux.HandleFunc("/v1/title", sessionsGenerateTitleHandler)

	// Sessions (all /v1/sessions/* routed through sessionsRouteHandler)
	mux.HandleFunc("/v1/sessions", sessionsRouteHandler)
	mux.HandleFunc("/v1/sessions/", func(w http.ResponseWriter, r *http.Request) {
		// Ensure the path starts with /v1/sessions/
		if !strings.HasPrefix(r.URL.Path, "/v1/sessions/") {
			http.NotFound(w, r)
			return
		}
		sessionsRouteHandler(w, r)
	})

	// Monitor routes
	mux.HandleFunc("/v1/monitor/stream", monitorStreamHandler)
	mux.HandleFunc("/v1/monitor/projects", monitorProjectsRouteHandler)
	mux.HandleFunc("/v1/monitor/projects/", func(w http.ResponseWriter, r *http.Request) {
    if strings.HasSuffix(r.URL.Path, "/fix") {
        requireBrainSecret(http.HandlerFunc(monitorProjectsRouteHandler)).ServeHTTP(w, r)
        return
    }
    monitorProjectsRouteHandler(w, r)
})

mux.HandleFunc("/v1/monitor/process/", func(w http.ResponseWriter, r *http.Request) {
    path := strings.TrimPrefix(r.URL.Path, "/v1/monitor/process/")
    if path == "spawn" || path == "stop" {
        requireBrainSecret(http.HandlerFunc(monitorProjectsRouteHandler)).ServeHTTP(w, r)
        return
    }
    monitorProjectsRouteHandler(w, r)
})
	mux.HandleFunc("/v1/monitor/alerts", monitorAlertsHandler)

	// Security routes
	mux.HandleFunc("/v1/security/scan", securityScanHandler)
	mux.HandleFunc("/v1/security/rules", securityRulesHandler)
	mux.HandleFunc("/v1/security/scans", securityScansHandler)

	// Deploy routes
mux.HandleFunc("/v1/deploy", deployHandler)
mux.HandleFunc("/v1/deploy/logs", deployLogsHandler)
mux.Handle("/v1/deploy/action", requireBrainSecret(http.HandlerFunc(deployActionHandler)))

	// Ports route (real-time port discovery and allocation)
	mux.HandleFunc("/v1/ports", portsHandler)

	// Project explorer routes
	mux.HandleFunc("/v1/projects/files", projectsFilesHandler)
	mux.HandleFunc("/v1/projects/file-content", projectsFileContentHandler)
	mux.HandleFunc("/v1/projects/analyze", projectsAnalyzeHandler)

	// Container routes
mux.HandleFunc("/v1/containers", containersListHandler)
mux.HandleFunc("/v1/containers/", func(w http.ResponseWriter, r *http.Request) {
    path := r.URL.Path

    if strings.HasSuffix(path, "/logs") {
        requireBrainSecret(http.HandlerFunc(containerLogsHandler)).ServeHTTP(w, r)
    } else if strings.Contains(path, "/start") ||
        strings.Contains(path, "/stop") ||
        strings.Contains(path, "/restart") ||
        strings.Contains(path, "/remove") ||
        strings.Contains(path, "/rm") {
        requireBrainSecret(http.HandlerFunc(containerActionHandler)).ServeHTTP(w, r)
    } else {
        containerInspectHandler(w, r)
    }
})

	// Terminal routes (interactive host and container execution)
	mux.Handle("/v1/terminal/exec", requireBrainSecret(http.HandlerFunc(terminalExecHandler)))
	mux.Handle("/v1/terminal/stream", requireBrainSecret(http.HandlerFunc(terminalStreamHandler)))

	return corsMiddleware(mux)
}
