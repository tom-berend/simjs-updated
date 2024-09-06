export class DataSeries {
    name = '';
    Count = 0;
    W = 0.0;
    A = 0.0;
    Q = 0.0;
    Max = -Infinity;
    Min = Infinity;
    Sum = 0;
    histogram = [];
    hLower = 0;
    hUpper = 0;
    nbuckets = 0;
    hBucketSize = 0;
    constructor(name) {
        this.name = name;
        this.reset();
    }
    reset() {
        this.Count = 0;
        this.W = 0.0; // weight
        this.A = 0.0;
        this.Q = 0.0;
        this.Max = -Infinity;
        this.Min = Infinity;
        this.Sum = 0;
        if (this.histogram) {
            for (let i = 0; i < this.histogram.length; i++) {
                this.histogram[i] = 0;
            }
        }
    }
    setHistogram(lower, upper, nbuckets) {
        this.hLower = lower;
        this.hUpper = upper;
        this.hBucketSize = (upper - lower) / nbuckets;
        this.histogram = new Array(nbuckets + 2);
        for (let i = 0; i < this.histogram.length; i++) {
            this.histogram[i] = 0;
        }
    }
    getHistogram() {
        return this.histogram;
    }
    record(value, weight = 1) {
        // document.write("Data series recording " + value + " (weight = " + w + ")\n");
        if (value > this.Max)
            this.Max = value;
        if (value < this.Min)
            this.Min = value;
        this.Sum += value;
        this.Count++;
        if (this.histogram) {
            if (value < this.hLower) {
                this.histogram[0] += weight;
            }
            else if (value > this.hUpper) {
                this.histogram[this.histogram.length - 1] += weight;
            }
            else {
                const index = Math.floor((value - this.hLower) / this.hBucketSize) + 1;
                this.histogram[index] += weight;
            }
        }
        // Wi = Wi-1 + wi
        this.W = this.W + weight;
        if (this.W === 0) {
            return;
        }
        // Ai = Ai-1 + wi/Wi * (xi - Ai-1)
        const lastA = this.A;
        this.A = lastA + (weight / this.W) * (value - lastA);
        // Qi = Qi-1 + wi(xi - Ai-1)(xi - Ai)
        this.Q = this.Q + weight * (value - lastA) * (value - this.A);
        // print("\tW=" + this.W + " A=" + this.A + " Q=" + this.Q + "\n");
    }
    count() {
        return this.Count;
    }
    min() {
        return this.Min;
    }
    max() {
        return this.Max;
    }
    range() {
        return this.Max - this.Min;
    }
    sum() {
        return this.Sum;
    }
    sumWeighted() {
        return this.A * this.W;
    }
    average() {
        return this.A;
    }
    variance() {
        return this.Q / this.W;
    }
    deviation() {
        return Math.sqrt(this.variance());
    }
}
export class TimeSeries {
    dataSeries;
    lastValue = NaN;
    lastTimestamp = NaN;
    constructor(name) {
        this.dataSeries = new DataSeries(name);
    }
    reset() {
        this.dataSeries.reset();
        this.lastValue = NaN;
        this.lastTimestamp = NaN;
    }
    setHistogram(lower, upper, nbuckets) {
        this.dataSeries.setHistogram(lower, upper, nbuckets);
    }
    getHistogram() {
        return this.dataSeries.getHistogram();
    }
    record(value, timestamp) {
        if (!isNaN(this.lastTimestamp)) {
            this.dataSeries.record(this.lastValue, timestamp - this.lastTimestamp);
        }
        this.lastValue = value;
        this.lastTimestamp = timestamp;
    }
    finalize() {
        this.record(NaN, NaN);
    }
    count() {
        return this.dataSeries.count();
    }
    min() {
        return this.dataSeries.min();
    }
    max() {
        return this.dataSeries.max();
    }
    range() {
        return this.dataSeries.range();
    }
    sum() {
        return this.dataSeries.sum();
    }
    average() {
        return this.dataSeries.average();
    }
    deviation() {
        return this.dataSeries.deviation();
    }
    variance() {
        return this.dataSeries.variance();
    }
}
export class Population {
    name;
    population = 0;
    sizeSeries;
    durationSeries;
    constructor(name) {
        this.name = name;
        this.population = 0;
        this.sizeSeries = new TimeSeries(name);
        this.durationSeries = new DataSeries(name);
    }
    reset() {
        this.sizeSeries.reset();
        this.durationSeries.reset();
        this.population = 0;
    }
    enter(timestamp) {
        this.population++;
        this.sizeSeries.record(this.population, timestamp);
    }
    leave(arrivalAt, leftAt) {
        this.population--;
        this.sizeSeries.record(this.population, leftAt);
        this.durationSeries.record(leftAt - arrivalAt);
    }
    current() {
        return this.population;
    }
    finalize() {
        this.sizeSeries.finalize();
    }
}
//# sourceMappingURL=stats.js.map