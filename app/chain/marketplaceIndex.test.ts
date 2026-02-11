import { describe, expect, it } from 'vitest';
import { pickFirstListingByCategory } from './marketplaceIndex';

describe('pickFirstListingByCategory', () => {
  it('returns listing object id by category from marketplace parsed fields', () => {
    const marketplaceFields = {
      active_listings: [
        {
          listing: '0xembroidery-listing',
          category: '0',
          listing_id: '1',
          ask_amount: '1000000',
          merchant: '0xmerchant1',
          merchant_id: '1',
          sku: '1001',
        },
        {
          listing: '0xtea-listing',
          category: '1',
          listing_id: '2',
          ask_amount: '1200000',
          merchant: '0xmerchant2',
          merchant_id: '2',
          sku: '2001',
        },
      ],
    };

    expect(pickFirstListingByCategory(marketplaceFields, 0)).toBe('0xembroidery-listing');
    expect(pickFirstListingByCategory(marketplaceFields, 1)).toBe('0xtea-listing');
    expect(pickFirstListingByCategory(marketplaceFields, 2)).toBeNull();
  });
});
