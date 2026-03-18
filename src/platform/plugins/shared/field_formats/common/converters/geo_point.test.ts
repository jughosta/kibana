/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { GeoPointFormat } from './geo_point';
import { HTML_CONTEXT_TYPE, TEXT_CONTEXT_TYPE } from '../content_types';

describe('GeoPoint Format', () => {
  describe('output format', () => {
    test('"lat_lon_string"', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'lat_lon_string',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert({ type: 'Point', coordinates: [125.6, 10.1] })).toBe(
        '10.1,125.6'
      );
    });

    test('"WKT"', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'wkt',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert({ type: 'Point', coordinates: [125.6, 10.1] })).toBe(
        'POINT (125.6 10.1)'
      );
    });
  });

  describe('inputs', () => {
    test('Geopoint expressed as an GeoJson geometry', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'lat_lon_string',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert({ type: 'Point', coordinates: [125.6, 10.1] })).toBe(
        '10.1,125.6'
      );
    });

    test('Geopoint expressed as an object, with lat and lon keys', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'lat_lon_string',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert({ lat: 10.1, lon: 125.6 })).toBe('10.1,125.6');
    });

    test('Geopoint expressed as a string with the format: "lat,lon"', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'lat_lon_string',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert('10.1,125.6')).toBe('10.1,125.6');
    });

    test('Geopoint expressed as a Well-Known Text POINT with the format: "POINT (lon lat)"', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'lat_lon_string',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert('POINT (125.6 10.1)')).toBe('10.1,125.6');
    });

    test('non-geopoint', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'lat_lon_string',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert('notgeopoint')).toBe('notgeopoint');
    });

    test('missing value', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'lat_lon_string',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert(null, TEXT_CONTEXT_TYPE)).toBe('(null)');
      expect(geoPointFormat.convert(undefined, TEXT_CONTEXT_TYPE)).toBe('(null)');
      expect(geoPointFormat.convert(null, HTML_CONTEXT_TYPE)).toBe(
        '<span class="ffString__emptyValue">(null)</span>'
      );
      expect(geoPointFormat.convert(undefined, HTML_CONTEXT_TYPE)).toBe(
        '<span class="ffString__emptyValue">(null)</span>'
      );
    });

    test('escapes HTML characters in html context via fallback', () => {
      const geoPointFormat = new GeoPointFormat(
        {
          transform: 'lat_lon_string',
        },
        jest.fn()
      );
      expect(geoPointFormat.convert('<script>alert("test")</script>', HTML_CONTEXT_TYPE)).toBe(
        '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;'
      );
    });
  });
});

describe('GeoPoint Format — reactConvert', () => {
  const makeFormatter = () => new GeoPointFormat({ transform: 'lat_lon_string' }, jest.fn());

  test('returns a plain string for a geo point', () => {
    const formatter = makeFormatter();
    expect(
      formatter.reactConvert({ type: 'Point', coordinates: [125.6, 10.1] })
    ).toMatchInlineSnapshot(`"10.1,125.6"`);
  });

  test('returns null placeholder for null', () => {
    const formatter = makeFormatter();
    expect(formatter.reactConvert(null)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
  });

  test('wraps a multi-value array with bracket notation', () => {
    const formatter = makeFormatter();
    expect(
      formatter.reactConvert([
        { type: 'Point', coordinates: [125.6, 10.1] },
        { type: 'Point', coordinates: [0, 51.5] },
      ])
    ).toMatchInlineSnapshot(`
      <React.Fragment>
        <span
          className="ffArray__highlight"
        >
          [
        </span>
        10.1,125.6
        <span
          className="ffArray__highlight"
        >
          ,
        </span>
         
        51.5,0
        <span
          className="ffArray__highlight"
        >
          ]
        </span>
      </React.Fragment>
    `);
  });

  test('returns the single element without brackets for a one-element array', () => {
    const formatter = makeFormatter();
    expect(
      formatter.reactConvert([{ type: 'Point', coordinates: [125.6, 10.1] }])
    ).toMatchInlineSnapshot(`"10.1,125.6"`);
  });
});
