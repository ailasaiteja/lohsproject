import React, { useEffect, useState } from "react";
import { fetchMyProducts } from "./myproductsAPI";
import "bootstrap/dist/css/bootstrap.min.css";
import LoadingToast from "../loading/LoadingToast";

const MyProducts = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState(0);

  const [popupMsg, setPopupMsg] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);

  // Fetch products from API using the imported function
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchMyProducts(); // Use the imported function
      
      // Extract products array from the response
      // Your response structure: { success: true, products: [...] }
      const productsData = response?.products || [];
      
      setProducts(productsData);
      setError(null);
    } catch (error) {
      console.error("Error fetching my products:", error);
      setError("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = products
    .filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(search.toLowerCase()) || false;
      const categoryMatch = category ? p.category === category : true;
      return nameMatch && categoryMatch;
    })
    .sort((a, b) => {
      const priceA = parseFloat(a.vendor_price) || 0;
      const priceB = parseFloat(b.vendor_price) || 0;
      
      if (sort === "low") return priceA - priceB;
      if (sort === "high") return priceB - priceA;
      return 0;
    });

  // Get unique categories from products
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Helper function to get product image
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].image_url;
    }
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingToast show={loading} />
  }

  if (error) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f5f7fb", minHeight: "100vh" }}>
        <h2 className="mb-4">My Products</h2>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "400px" }}>
          <div className="text-danger mb-3">{error}</div>
          <button className="btn btn-primary" onClick={fetchProducts}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f5f7fb",color: "#df3f2f", minHeight: "100vh" }}>
      <h2 className="mb ">My Products</h2>

      {/* Filters Section */}
      <div className="card mb-4" >
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Search by product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={categories.length === 0}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="">Sort By Price</option>
                <option value="low">Low to High</option>
                <option value="high">High to Low</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-danger w-100"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setSort("");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Count */}
      <div className="mb-3 text-muted">
        Showing {filteredProducts.length} of {products.length} products
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="row g-4">
          {filteredProducts.map((product) => {
            const sold = (product.quantity || 0) - (product.remaining_quantity || 0);
            
            return (
              <div key={product.id} className="col-xl-3 col-lg-4 col-md-6">
                <div className="card h-100 shadow-sm hover-shadow transition">
                  <img
                    src={getProductImage(product)}
                    className="card-img-top"
                    alt={product.name}
                    style={{ height: "200px", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                  
                  <div className="card-body">
                    <h5 className="card-title mb-2">{product.name}</h5>
                    <div className="text-muted small mb-2">{product.category}</div>
                    
                    <div className="h4 text-success mb-1">
                      ₹{parseFloat(product.vendor_price).toFixed(2)}
                    </div>

                    {product.strikethrough_price && (
                      <div className="small mb-3">
                        <span className="text-decoration-line-through text-muted me-2">
                          ₹{parseFloat(product.strikethrough_price).toFixed(2)}
                        </span>
                        <span className="text-success">
                          Save ₹{(parseFloat(product.strikethrough_price) - parseFloat(product.vendor_price)).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Stock Information */}
                    <div className="bg-light p-3 rounded-3 mb-3">
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="small text-muted">Total</div>
                          <div className="fw-bold">{product.quantity}</div>
                        </div>
                        <div className="col-4">
                          <div className="small text-muted">Sold</div>
                          <div className="fw-bold">{sold}</div>
                        </div>
                        <div className="col-4">
                          <div className="small text-muted">Available</div>
                          <div className="fw-bold">{product.remaining_quantity}</div>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="small text-muted mb-3">
                      <div className="d-flex justify-content-between">
                        <span>Created:</span>
                        <span>{formatDate(product.created_at)}</span>
                      </div>
                      {product.updated_at && product.updated_at !== product.created_at && (
                        <div className="d-flex justify-content-between">
                          <span>Updated:</span>
                          <span>{formatDate(product.updated_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-warning flex-fill text-white"
                        disabled={!product.is_active}
                        onClick={() => {
                          setEditingId(product.id);
                          setEditStock(product.quantity);
                          setShowEditPopup(true);
                        }}
                      >
                        Edit Stock
                      </button>

                      <button
                        className={`btn flex-fill ${product.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => {
                          setProducts(prev =>
                            prev.map(p =>
                              p.id === product.id ? { ...p, is_active: !p.is_active } : p
                            )
                          );
                          setPopupMsg(
                            product.is_active
                              ? "Product deactivated successfully"
                              : "Product activated successfully"
                          );
                          setShowPopup(true);
                        }}
                      >
                        {product.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-5 bg-white rounded-3">
          <p className="text-muted mb-0">
            {products.length === 0 ? "No products found" : "No products match your filters"}
          </p>
        </div>
      )}

      {/* Success/Info Popup */}
      {showPopup && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <p className="mb-4">{popupMsg}</p>
                <button className="btn btn-primary" onClick={() => setShowPopup(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Popup */}
      {showEditPopup && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Stock</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditPopup(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                  placeholder="Enter new stock"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditPopup(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setProducts(prev =>
                      prev.map(p =>
                        p.id === editingId ? { ...p, quantity: editStock } : p
                      )
                    );
                    setShowEditPopup(false);
                    setPopupMsg("Stock updated successfully");
                    setShowPopup(true);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for hover effect */}
      <style jsx>{`
        .hover-shadow {
          transition: all 0.2s ease-in-out;
        }
        .hover-shadow:hover {
          transform: translateY(-4px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .btn-warning:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default MyProducts;