/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { prisma } from "@/lib/prisma";

export const runtime = 'edge';
export const revalidate = 86400;

export const alt = 'Product Image';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      price: true,
      image: true,
      brand: true,
    }
  });

  if (!product) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>Product Not Found</h1>
        </div>
      ),
      { ...size }
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #ffffff, #f5f3ff)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Left Side: Image Container */}
        <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              style={{
                maxWidth: '450px',
                maxHeight: '450px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{ background: '#e0e7ff', width: '350px', height: '350px', borderRadius: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ fontSize: '100px' }}>📦</span>
            </div>
          )}
        </div>

        {/* Right Side: Product Info */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            marginLeft: '60px',
          }}
        >
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#4f46e5', 
            textTransform: 'uppercase', 
            letterSpacing: '4px', 
            marginBottom: '16px',
            opacity: 0.8
          }}>
            {product.brand || 'Input Gears'}
          </div>
          <div
            style={{
              fontSize: '64px',
              fontWeight: '900',
              color: '#111827',
              lineHeight: '1.1',
              marginBottom: '40px',
              fontFamily: 'sans-serif',
            }}
          >
            {product.name}
          </div>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                fontSize: '48px',
                fontWeight: '900',
                color: '#ffffff',
                backgroundColor: '#4f46e5',
                padding: '12px 32px',
                borderRadius: '24px',
                boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.2)',
              }}
            >
              {formattedPrice}
            </div>
          </div>
        </div>

        {/* Brand Logo Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ 
            background: '#4f46e5', 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            marginRight: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '20px'
          }}>Z</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#111827', letterSpacing: '-1px' }}>
            Input<span style={{ color: '#4f46e5' }}>Gears</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    }
  );
}
