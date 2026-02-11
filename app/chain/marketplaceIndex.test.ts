import { describe, expect, it } from 'vitest';
import { pickFirstActiveListingByCategory, pickFirstListingByCategory } from './marketplaceIndex';

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

  it('supports active_listings entries in move object shape', () => {
    const marketplaceFields = {
      active_listings: [
        {
          type: '0xpackage::market::ActiveListingRef',
          fields: {
            listing: '0xembroidery-listing-real-shape',
            listing_id: '3',
            category: 0,
          },
        },
        {
          type: '0xpackage::market::ActiveListingRef',
          fields: {
            listing: '0xtea-listing-real-shape',
            listing_id: '6',
            category: 1,
          },
        },
      ],
    };

    expect(pickFirstListingByCategory(marketplaceFields, 0)).toBe('0xembroidery-listing-real-shape');
    expect(pickFirstListingByCategory(marketplaceFields, 1)).toBe('0xtea-listing-real-shape');

    expect(pickFirstActiveListingByCategory(marketplaceFields, 0)).toEqual({
      listingId: '0xembroidery-listing-real-shape',
      category: 0,
      askAmount: 0n,
    });
  });

  it('prefers the lowest ask amount for the same category', () => {
    const marketplaceFields = {
      active_listings: [
        {
          fields: {
            listing: '0xtea-expensive',
            listing_id: '10',
            category: 1,
            ask_amount: '120000000',
          },
        },
        {
          fields: {
            listing: '0xtea-cheap',
            listing_id: '11',
            category: 1,
            ask_amount: '100000',
          },
        },
      ],
    };

    expect(pickFirstListingByCategory(marketplaceFields, 1)).toBe('0xtea-cheap');
    expect(pickFirstActiveListingByCategory(marketplaceFields, 1)).toEqual({
      listingId: '0xtea-cheap',
      category: 1,
      askAmount: 100000n,
    });
  });
});
