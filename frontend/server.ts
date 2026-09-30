import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { EVENTS_DATA, INITIAL_ITEMS } from './src/data/mockItems.ts';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK safely
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// 1. API: Get all event contexts
app.get('/api/events', (_req, res) => {
  res.json({
    success: true,
    data: EVENTS_DATA
  });
});

// 2. API: Get fashion items (filtered or enriched by event)
app.get('/api/items', (req, res) => {
  const eventId = (req.query.event as string) || 'cafe_street';
  const category = req.query.category as string | undefined;

  const currentEvent = EVENTS_DATA.find((e) => e.id === eventId) || EVENTS_DATA[0];

  const enrichedItems = INITIAL_ITEMS.map((item) => {
    // Check if item matches current event
    const isDirectMatch = item.suitableEvents.includes(eventId);
    // Check tag overlaps
    const hasTagMatch = item.tags.some((tag) => currentEvent.suitableTags.includes(tag));
    const isSuitable = isDirectMatch || hasTagMatch;

    return {
      ...item,
      isSuitableForCurrentEvent: isSuitable,
      suitabilityScore: isSuitable ? Math.max(item.suitabilityScore, 85) : Math.min(item.suitabilityScore, 50)
    };
  });

  const filtered = category
    ? enrichedItems.filter((i) => i.category === category)
    : enrichedItems;

  res.json({
    success: true,
    data: filtered,
    meta: {
      eventId,
      total: filtered.length
    }
  });
});

// 3. API: Gemini AI Stylist Recommendation
app.post('/api/gemini/recommend-outfit', async (req, res) => {
  try {
    const { prompt, eventId } = req.body;
    const currentEvent = EVENTS_DATA.find((e) => e.id === eventId) || EVENTS_DATA[0];

    // Prepare catalog summary for Gemini
    const itemCatalog = INITIAL_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      style: item.style,
      color: item.color,
      tags: item.tags
    }));

    if (!apiKey) {
      // Graceful fallback if API key is not yet set in environment
      return res.json({
        success: true,
        data: {
          stylistMessage: `Chào bạn! Snoopy Stylist đã lắng nghe mong muốn: "${prompt || 'Phong cách tinh tế'}". Cho bối cảnh ${currentEvent.sceneName}, Snoopy đề xuất bạn phối chiếc Áo Len Dệt Sọc Vintage với Quần Suông Xếp Ly Beige Classic và đôi Oxford Da Bò nâu ấm áp, điểm xuyết chiếc Mũ Nồi Beret Đỏ!`,
          recommendedItemIds: ['ao_001', 'quan_001', 'giay_001', 'phukien_001'],
          matchedCategories: {
            aoId: 'ao_001',
            quanId: 'quan_001',
            giayId: 'giay_001',
            phukienId: 'phukien_001'
          },
          styleVibe: 'French Chic & Warm Autumn',
          tips: [
            'Sơ vin nhẹ vạt trước áo len để lộ cạp quần thắt lưng da sang trọng.',
            'Đội mũ beret hơi chếch về bên trái để tạo thần thái nghệ sĩ.',
            'Tông màu kem be và đỏ ruby tạo sự tương phản đầy ấm áp.'
          ]
        }
      });
    }

    const systemInstruction = `Bạn là Snoopy Stylist - chuyên gia thời trang cá nhân của chú cún Snoopy và người dùng. Giọng điệu của bạn vui tươi, hài hước, sành điệu, đậm chất thời trang cao cấp kiểu Pháp nhưng rất gần gũi và nhiệt thành.
Nhiệm vụ của bạn là nhận yêu cầu của người dùng cùng sự kiện hiện tại, sau đó chọn ra 1 chiếc Áo (ao), 1 chiếc Quần (quan), 1 đôi Giày (giay), và 1 Phụ kiện (phukien) từ danh sách sau:
${JSON.stringify(itemCatalog, null, 2)}

Hãy trả về định dạng JSON thuần túy (không bọc markdown \`\`\`json) với cấu trúc:
{
  "stylistMessage": "Lời nhắn vui vẻ, khen ngợi và phân tích gu của người dùng bằng tiếng Việt (khoảng 3-4 câu)",
  "recommendedItemIds": ["ao_id", "quan_id", "giay_id", "phukien_id"],
  "matchedCategories": {
    "aoId": "id áo tốt nhất",
    "quanId": "id quần tốt nhất",
    "giayId": "id giày tốt nhất",
    "phukienId": "id phụ kiện tốt nhất"
  },
  "styleVibe": "Tên phong cách (ví dụ: Parisian Artist, Vintage Cafe, Red Carpet Diva...)",
  "tips": [
    "Lời khuyên phối đồ 1",
    "Lời khuyên phối đồ 2",
    "Lời khuyên phối đồ 3"
  ]
}`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Bối cảnh sự kiện: ${currentEvent.title} (${currentEvent.sceneName}).
Yêu cầu & phong cách mong muốn từ người dùng: "${prompt || 'Hãy gợi ý cho tôi một bộ đồ thật đẹp, thanh lịch và ấn tượng'}"
Hãy chọn ra những món trang phục phù hợp nhất từ catalog và đưa ra tư vấn.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const responseText = geminiResponse.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch {
      parsedData = {
        stylistMessage: `Snoopy đã chọn cho bạn một outfit tuyệt đẹp cho sự kiện ${currentEvent.title}!`,
        recommendedItemIds: ['ao_001', 'quan_001', 'giay_001', 'phukien_001'],
        matchedCategories: {
          aoId: 'ao_001',
          quanId: 'quan_001',
          giayId: 'giay_001',
          phukienId: 'phukien_001'
        },
        styleVibe: 'Classic Snoopy Aesthetic',
        tips: ['Tự tin là phụ kiện đẹp nhất của bạn!']
      };
    }

    res.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Gemini recommendation error:', error);
    // Fallback gracefully on error so user experience is not broken
    res.json({
      success: true,
      data: {
        stylistMessage: 'Snoopy Stylist vừa nảy ra một ý tưởng phối đồ cực kỳ xuất sắc theo phong cách cổ điển thanh lịch, tôn trọn vẻ đẹp tự nhiên của bạn!',
        recommendedItemIds: ['ao_001', 'quan_001', 'giay_001', 'phukien_001'],
        matchedCategories: {
          aoId: 'ao_001',
          quanId: 'quan_001',
          giayId: 'giay_001',
          phukienId: 'phukien_001'
        },
        styleVibe: 'Timeless Vintage Chic',
        tips: [
          'Phối các tông màu be và kem để tạo cảm giác dịu mắt, ấm cúng.',
          'Điểm xuyết phụ kiện đỏ để tạo điểm nhấn thị giác cuốn hút.'
        ]
      }
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Snoopy Stylist Server is running on port ${port}`);
  });
}

startServer();
