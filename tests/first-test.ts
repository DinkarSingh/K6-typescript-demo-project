import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from '../config.ts';

export const options = {
  iterations: 10,
};

export default function () {
  http.get('https://quickpizza.grafana.com');

  // Sleep for 1 second to simulate real-world usage
  sleep(1);
}
