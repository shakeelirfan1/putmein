package api

import (
    "net/http"
    "os"
    "crypto/subtle"
)

func requireBrainSecret(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        expected := os.Getenv("BRAIN_INTERNAL_SECRET")
        provided := r.Header.Get("x-brain-secret")

        if expected == "" || provided == "" ||
            subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) != 1 {
            http.Error(w, "unauthorized", http.StatusUnauthorized)
            return
        }

        next.ServeHTTP(w, r)
    })
}
