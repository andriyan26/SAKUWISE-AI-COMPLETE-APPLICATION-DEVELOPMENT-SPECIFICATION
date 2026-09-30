import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';

export const uploadReceipt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'File struk tidak ditemukan atau format tidak didukung.' });
      return;
    }

    // Mock OCR engine extraction simulation
    // Extract realistic data based on filename or simulated receipt parsing
    const filenameLower = file.originalname.toLowerCase();
    let merchant = 'Superindo Supermarket';
    let total = 145000;
    let suggestedCategory = 'Belanja';
    let items = [
      { name: 'Beras Pandan Wangi 5kg', price: 78000, qty: 1 },
      { name: 'Minyak Goreng 2L', price: 34000, qty: 1 },
      { name: 'Telur Ayam 1kg', price: 33000, qty: 1 },
    ];

    if (filenameLower.includes('kopi') || filenameLower.includes('starbucks') || filenameLower.includes('cafe')) {
      merchant = 'Starbucks Coffee Indonesia';
      total = 62000;
      suggestedCategory = 'Makan & Minum';
      items = [
        { name: 'Iced Caffe Latte (Grande)', price: 58000, qty: 1 },
        { name: 'Paper Bag', price: 4000, qty: 1 },
      ];
    } else if (filenameLower.includes('pln') || filenameLower.includes('listrik')) {
      merchant = 'PLN Pascabayar';
      total = 385000;
      suggestedCategory = 'Tagihan';
      items = [{ name: 'Tagihan Listrik Rumah', price: 385000, qty: 1 }];
    } else if (filenameLower.includes('bensin') || filenameLower.includes('pertamina')) {
      merchant = 'SPBU Pertamina';
      total = 200000;
      suggestedCategory = 'Transportasi';
      items = [{ name: 'Pertamax 92 (15.5 L)', price: 200000, qty: 1 }];
    }

    const extractedData = {
      merchant,
      date: new Date().toISOString().split('T')[0],
      total,
      suggestedCategory,
      items,
      confidence: 0.94,
    };

    const receipt = await prisma.receipt.create({
      data: {
        userId,
        storageKey: file.path,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        ocrStatus: 'COMPLETED',
        extractedDataJson: JSON.stringify(extractedData),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Struk berhasil diunggah dan dianalisis!',
      data: {
        receiptId: receipt.id,
        filename: receipt.originalFilename,
        extracted: extractedData,
      },
    });
  } catch (error) {
    console.error('uploadReceipt error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses struk.' });
  }
};

export const getReceiptById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const receipt = await prisma.receipt.findFirst({
      where: { id, userId },
    });

    if (!receipt) {
      res.status(404).json({ success: false, message: 'Struk tidak ditemukan.' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...receipt,
        extracted: receipt.extractedDataJson ? JSON.parse(receipt.extractedDataJson) : null,
      },
    });
  } catch (error) {
    console.error('getReceiptById error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data struk.' });
  }
};
