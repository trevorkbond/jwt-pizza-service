const os = require("os");
const config = require("../config.json");

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.numGetRequests = 0;
    this.numPostRequests = 0;
    this.numPutRequests = 0;
    this.numDeleteRequests = 0;
    this.metricSource = config.source;
    this.apiKey = config.apiKey;
    this.userId = config.userId;
    this.metricsUrl = config.url;

    this.sendMetricsPeriodically(10000);
  }

  sendMetricToGrafana(metric) {
    fetch(`${config.url}`, {
      method: "post",
      body: metric,
      headers: { Authorization: `Bearer ${this.userId}:${this.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to push metrics data to Grafana");
          console.log(response);
        } else {
          console.log(`Pushed ${metric}`);
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

  sendMetricsPeriodically(period) {
    const timer = setInterval(() => {
      try {
        const buf = new MetricBuilder();
        // httpMetrics(buf);
        this.systemMetrics(buf);
        // userMetrics(buf);
        // purchaseMetrics(buf);
        // authMetrics(buf);

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
      `${metricPrefix},source=${config.source},${key}=${value} ${metricName}=${metricValue}`
    );
  }

  toString() {
    return this.metrics.join("\n");
  }
}

const metrics = new Metrics();
module.exports = metrics;
