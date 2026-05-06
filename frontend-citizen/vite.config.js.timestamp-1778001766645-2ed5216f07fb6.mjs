// vite.config.js
import { defineConfig } from "file:///D:/Users/rcnai/Desktop/pro.org.1/frontend-citizen/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Users/rcnai/Desktop/pro.org.1/frontend-citizen/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { visualizer } from "file:///D:/Users/rcnai/Desktop/pro.org.1/frontend-citizen/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "D:\\Users\\rcnai\\Desktop\\pro.org.1\\frontend-citizen";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: function(path2) {
          return path2.replace(/^\/api/, "");
        },
        secure: false
      },
      "/nlp": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        rewrite: function(path2) {
          return path2.replace(/^\/nlp/, "");
        },
        secure: false
      },
      "/parli": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        rewrite: function(path2) {
          return path2.replace(/^\/parli/, "");
        },
        secure: false
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: function(id) {
          if (!id.includes("node_modules"))
            return;
          if (id.includes("/react") || id.includes("/react-dom") || id.includes("/@tanstack/react-query")) {
            return "react-vendor";
          }
          if (id.includes("/axios")) {
            return "network-vendor";
          }
          if (id.includes("/lodash")) {
            return "lodash-vendor";
          }
          if (id.includes("/date-fns")) {
            return "date-fns-vendor";
          }
          if (id.includes("/recharts") || id.includes("/chart.js") || id.includes("/d3") || id.includes("/victory")) {
            return "charts-vendor";
          }
          if (id.includes("/react-leaflet") || id.includes("/leaflet")) {
            return "map-vendor";
          }
          return "vendor";
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxVc2Vyc1xcXFxyY25haVxcXFxEZXNrdG9wXFxcXHByby5vcmcuMVxcXFxmcm9udGVuZC1jaXRpemVuXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxVc2Vyc1xcXFxyY25haVxcXFxEZXNrdG9wXFxcXHByby5vcmcuMVxcXFxmcm9udGVuZC1jaXRpemVuXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Vc2Vycy9yY25haS9EZXNrdG9wL3Byby5vcmcuMS9mcm9udGVuZC1jaXRpemVuL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgdmlzdWFsaXplcih7XG4gICAgICAgICAgICBvcGVuOiBmYWxzZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiAnZGlzdC9zdGF0cy5odG1sJyxcbiAgICAgICAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgICAgICAgICAgYnJvdGxpU2l6ZTogdHJ1ZSxcbiAgICAgICAgfSksXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICAgIGFsaWFzOiB7XG4gICAgICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgICBob3N0OiAnMC4wLjAuMCcsXG4gICAgICAgIHByb3h5OiB7XG4gICAgICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDAnLFxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICByZXdyaXRlOiBmdW5jdGlvbiAocGF0aCkgeyByZXR1cm4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpOyB9LFxuICAgICAgICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJy9ubHAnOiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTo4MDAxJyxcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgICAgICAgcmV3cml0ZTogZnVuY3Rpb24gKHBhdGgpIHsgcmV0dXJuIHBhdGgucmVwbGFjZSgvXlxcL25scC8sICcnKTsgfSxcbiAgICAgICAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICcvcGFybGknOiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTo4MDgwJyxcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgICAgICAgcmV3cml0ZTogZnVuY3Rpb24gKHBhdGgpIHsgcmV0dXJuIHBhdGgucmVwbGFjZSgvXlxcL3BhcmxpLywgJycpOyB9LFxuICAgICAgICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogODAwLFxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICBtYW51YWxDaHVua3M6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvcmVhY3QnKSB8fCBpZC5pbmNsdWRlcygnL3JlYWN0LWRvbScpIHx8IGlkLmluY2x1ZGVzKCcvQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9heGlvcycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ25ldHdvcmstdmVuZG9yJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9sb2Rhc2gnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdsb2Rhc2gtdmVuZG9yJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9kYXRlLWZucycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2RhdGUtZm5zLXZlbmRvcic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvcmVjaGFydHMnKSB8fCBpZC5pbmNsdWRlcygnL2NoYXJ0LmpzJykgfHwgaWQuaW5jbHVkZXMoJy9kMycpIHx8IGlkLmluY2x1ZGVzKCcvdmljdG9yeScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2NoYXJ0cy12ZW5kb3InO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3JlYWN0LWxlYWZsZXQnKSB8fCBpZC5pbmNsdWRlcygnL2xlYWZsZXQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdtYXAtdmVuZG9yJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlWLFNBQVMsb0JBQW9CO0FBQzlXLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxrQkFBa0I7QUFIM0IsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sV0FBVztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2hCLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsTUFDSCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDeEM7QUFBQSxFQUNKO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDSCxRQUFRO0FBQUEsUUFDSixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLFNBQVVBLE9BQU07QUFBRSxpQkFBT0EsTUFBSyxRQUFRLFVBQVUsRUFBRTtBQUFBLFFBQUc7QUFBQSxRQUM5RCxRQUFRO0FBQUEsTUFDWjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ0osUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxTQUFVQSxPQUFNO0FBQUUsaUJBQU9BLE1BQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxRQUFHO0FBQUEsUUFDOUQsUUFBUTtBQUFBLE1BQ1o7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsU0FBVUEsT0FBTTtBQUFFLGlCQUFPQSxNQUFLLFFBQVEsWUFBWSxFQUFFO0FBQUEsUUFBRztBQUFBLFFBQ2hFLFFBQVE7QUFBQSxNQUNaO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNILHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNKLGNBQWMsU0FBVSxJQUFJO0FBQ3hCLGNBQUksQ0FBQyxHQUFHLFNBQVMsY0FBYztBQUMzQjtBQUNKLGNBQUksR0FBRyxTQUFTLFFBQVEsS0FBSyxHQUFHLFNBQVMsWUFBWSxLQUFLLEdBQUcsU0FBUyx3QkFBd0IsR0FBRztBQUM3RixtQkFBTztBQUFBLFVBQ1g7QUFDQSxjQUFJLEdBQUcsU0FBUyxRQUFRLEdBQUc7QUFDdkIsbUJBQU87QUFBQSxVQUNYO0FBQ0EsY0FBSSxHQUFHLFNBQVMsU0FBUyxHQUFHO0FBQ3hCLG1CQUFPO0FBQUEsVUFDWDtBQUNBLGNBQUksR0FBRyxTQUFTLFdBQVcsR0FBRztBQUMxQixtQkFBTztBQUFBLFVBQ1g7QUFDQSxjQUFJLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsS0FBSyxLQUFLLEdBQUcsU0FBUyxVQUFVLEdBQUc7QUFDdkcsbUJBQU87QUFBQSxVQUNYO0FBQ0EsY0FBSSxHQUFHLFNBQVMsZ0JBQWdCLEtBQUssR0FBRyxTQUFTLFVBQVUsR0FBRztBQUMxRCxtQkFBTztBQUFBLFVBQ1g7QUFDQSxpQkFBTztBQUFBLFFBQ1g7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIl0KfQo=
