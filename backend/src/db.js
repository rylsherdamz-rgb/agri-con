const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function upsertFarmer(data) {
  const { id, fullName, farmName, region, totalYieldKg, idDocPath, verified } = data;
  return prisma.farmer.upsert({
    where: { id },
    update: { fullName, farmName, region, totalYieldKg, idDocPath, verified },
    create: { id, fullName, farmName, region, totalYieldKg, idDocPath, verified: verified ?? false },
  });
}

async function getFarmer(id) {
  return prisma.farmer.findUnique({ where: { id } });
}

async function listFarmers() {
  return prisma.farmer.findMany({ orderBy: { updatedAt: "desc" } });
}

async function upsertListing(data) {
  const { nftId, cropType, quantityKg, priceUsdc, farmerId, parcelName, region, buyable, ndviBps, minNdviBps, areaHa, totalYieldKg, status } = data;
  return prisma.listing.upsert({
    where: { nftId },
    update: { cropType, quantityKg, priceUsdc, parcelName, region, buyable, ndviBps, minNdviBps, areaHa, totalYieldKg, status },
    create: { nftId, cropType, quantityKg, priceUsdc, farmerId, parcelName, region, buyable, ndviBps, minNdviBps, areaHa, totalYieldKg, status: status ?? "listed" },
  });
}

async function getListings(filters = {}) {
  const { buyable, region, farmerId, search } = filters;
  const where = {};
  if (buyable !== undefined) where.buyable = buyable;
  if (region) where.region = region;
  if (farmerId) where.farmerId = farmerId;
  if (search) {
    where.OR = [
      { parcelName: { contains: search, mode: "insensitive" } },
      { cropType: { contains: search, mode: "insensitive" } },
      { region: { contains: search, mode: "insensitive" } },
    ];
  }
  return prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, include: { farmer: { select: { fullName: true, farmName: true, region: true, verified: true } } } });
}

async function createOrder(data) {
  const { listingId, buyerAddress, amountUsdc, txHash, status } = data;
  return prisma.order.create({ data: { listingId, buyerAddress, amountUsdc, txHash, status: status ?? "escrow" } });
}

async function getOrders(filters = {}) {
  const { buyerAddress, farmerAddress, status } = filters;
  const where = {};
  if (buyerAddress) where.buyerAddress = buyerAddress;
  if (status) where.status = status;
  if (farmerAddress) {
    where.listing = { farmerId: farmerAddress };
  }
  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { farmer: { select: { fullName: true, farmName: true } } } } },
  });
}

async function recordAttestation(data) {
  const { nftId, observedAt, ndviBps, minNdviBps, buyable, bboxHash, reportHash, source } = data;
  return prisma.attestation.create({
    data: { nftId, observedAt: new Date(observedAt * 1000), ndviBps, minNdviBps, buyable, bboxHash, reportHash, source: source ?? "copernicus-sentinel2" },
  });
}

async function createReview(data) {
  const { orderId, reviewer, farmerId, rating, comment } = data;
  return prisma.review.create({
    data: { orderId, reviewer, farmerId, rating, comment },
  });
}

async function getReviews({ farmerId, orderId, reviewer } = {}) {
  const where = {};
  if (farmerId) where.farmerId = farmerId;
  if (orderId) where.orderId = orderId;
  if (reviewer) where.reviewer = reviewer;
  return prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { order: { include: { listing: { select: { parcelName: true, cropType: true } } } } },
  });
}

async function getAverageRating(farmerId) {
  const agg = await prisma.review.aggregate({
    where: { farmerId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return { average: agg._avg.rating ?? 0, count: agg._count.rating };
}

module.exports = { prisma, upsertFarmer, getFarmer, listFarmers, upsertListing, getListings, createOrder, getOrders, recordAttestation, createReview, getReviews, getAverageRating };