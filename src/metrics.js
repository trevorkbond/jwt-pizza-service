const os = require("os");
const config = require("./config.js");
const metricSource = config.metrics.source;

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.numGetRequests = 0;
    this.numPostRequests = 0;
    this.numPutRequests = 0;
    this.numDeleteRequests = 0;
    this.metricSource = config.metrics.source;
    this.apiKey = config.metrics.apiKey;
    this.userId = config.metrics.userId;
    this.metricsUrl = config.metrics.url;
    this.numActiveUsers = 0;
    this.failedLogins = 0;
    this.successfulLogins = 0;
    this.revenue = 0;
    this.successfulOrders = 0;
    this.failedOrders = 0;
    this.chaos = false;

    this.requestDuration = 0;
    this.pizzaDuration = 0;

    this.requestTracker = this.requestTracker.bind(this);
    this.sendMetricsPeriodically(10000);
  }

  recordRequestDuration(duration) {
    this.requestDuration += duration;
  }

  recordPizzaDuration(duration) {
    this.pizzaDuration += duration;
  }

  sendMetricToGrafana(metric) {
    fetch(`${this.metricsUrl}`, {
      method: "post",
      body: metric,
      headers: { Authorization: `Bearer ${this.userId}:${this.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to push metrics data to Grafana");
          console.log(response);
        }
      })
      .catch((error) => {
        console.error("Error pushing metrics:", error);
      });
  }

  systemMetrics(buf) {
    buf.addMetric(
      "system",
      "system_val",
      "cpu",
      "cpu",
      this.getCpuUsagePercentage()
    );
    buf.addMetric(
      "system",
      "system_val",
      "mem",
      "memory",
      this.getMemoryUsagePercentage()
    );
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  recordLogin() {
    this.successfulLogins++;
    this.numActiveUsers++;
  }

  incrementFailedLogins() {
    this.failedLogins++;
  }

  recordLogout() {
    this.numActiveUsers--;
  }

  recordSuccessfulOrder(price) {
    this.revenue += price;
    this.successfulOrders++;
  }

  recordFailedOrder() {
    this.failedOrders++;
  }

  recordChaos(newChaos) {
    this.chaos = newChaos;
  }

  requestTracker(req, res, next) {
    this.totalRequests++;

    switch (req.method) {
      case "GET":
        this.numGetRequests++;
        break;
      case "POST":
        this.numPostRequests++;
        break;
      case "PUT":
        this.numPutRequests++;
        break;
      case "DELETE":
        this.numDeleteRequests++;
        break;
      default:
        break;
    }

    const startTime = process.hrtime();

    res.on("finish", () => {
      const hrDuration = process.hrtime(startTime);
      const durationInMs = hrDuration[0] * 1000 + hrDuration[1] / 1000000;
      this.recordRequestDuration(durationInMs);
    });

    next();
  }

  httpMetrics(buf) {
    buf.addMetric("request", "method", "GET", "get", this.numGetRequests);
    buf.addMetric("request", "method", "POST", "post", this.numPostRequests);
    buf.addMetric("request", "method", "PUT", "put", this.numPutRequests);
    buf.addMetric(
      "request",
      "method",
      "DELETE",
      "delete",
      this.numDeleteRequests
    );
    buf.addMetric("request", "total", "all", "total", this.totalRequests);
    buf.addMetric(
      "request",
      "duration",
      "avg",
      "duration",
      this.requestDuration
    );
    buf.addMetric(
      "request",
      "pizza_duration",
      "avg",
      "pizza_avg_duration",
      this.pizzaDuration
    );
  }

  userMetrics(buf) {
    buf.addMetric("users", "users", "active", "active", this.numActiveUsers);
  }

  authMetrics(buf) {
    buf.addMetric("auth", "auth", "success", "success", this.successfulLogins);
    buf.addMetric("auth", "auth", "failed", "failed", this.failedLogins);
  }

  purchaseMetrics(buf) {
    buf.addMetric(
      "purchase",
      "purchase",
      "success",
      "success",
      this.successfulOrders
    );
    buf.addMetric(
      "purchase",
      "purchase",
      "failed",
      "failed",
      this.failedOrders
    );
    buf.addMetric("purchase", "purchase", "revenue", "revenue", this.revenue);
  }

  chaosMetrics(buf) {
    buf.addMetric("chaos", "chaos", "enabled", "enabled", this.chaos);
  }

  sendMetricsPeriodically(period) {
    const timer = setInterval(() => {
      try {
        const buf = new MetricBuilder();
        this.httpMetrics(buf);
        this.systemMetrics(buf);
        this.userMetrics(buf);
        this.purchaseMetrics(buf);
        this.authMetrics(buf);
        this.chaosMetrics(buf);

        const metrics = buf.toString();
        this.sendMetricToGrafana(metrics);
      } catch (error) {
        console.log("Error sending metrics", error);
      }
    }, period);
    timer.unref;
  }
}

class MetricBuilder {
  constructor() {
    this.metrics = [];
  }

  addMetric(metricPrefix, key, value, metricName, metricValue) {
    this.metrics.push(
      `${metricPrefix},source=${metricSource},${key}=${value} ${metricName}=${metricValue}`
    );
  }

  toString() {
    return this.metrics.join("\n");
  }
}

const metrics = new Metrics();
module.exports = metrics;
