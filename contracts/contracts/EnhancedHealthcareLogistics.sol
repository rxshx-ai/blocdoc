// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EnhancedHealthcareLogistics
 * @dev Advanced decentralized healthcare logistics with reputation, disputes, and AI integration
 */
contract EnhancedHealthcareLogistics is AccessControl, ReentrancyGuard, Pausable {
    
    // ============ Roles ============
    bytes32 public constant SHIPMENT_MANAGER_ROLE = keccak256("SHIPMENT_MANAGER_ROLE");
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    bytes32 public constant TELEMETRY_ROLE = keccak256("TELEMETRY_ROLE");
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");
    
    // ============ Enums ============
    enum ShipmentStatus {
        CREATED,
        BIDDING,
        PROVIDER_SELECTED,
        AWAITING_PICKUP,
        IN_TRANSIT,
        DELIVERED,
        DISPUTED,
        RESOLVED,
        CANCELLED
    }
    
    enum DisputeStatus {
        OPEN,
        UNDER_REVIEW,
        RESOLVED_PROVIDER_FAULT,
        RESOLVED_SHIPPER_FAULT,
        RESOLVED_MUTUAL,
        REJECTED
    }
    
    enum AlertSeverity {
        INFO,
        WARNING,
        CRITICAL
    }
    
    // ============ Structs ============
    struct Shipment {
        string shipment_id;
        string pickup_location;
        string delivery_location;
        string cargo_type;
        string cargo_description;
        int256 temperature_min;
        int256 temperature_max;
        int256 humidity_min;
        int256 humidity_max;
        uint256 pickup_time;
        uint256 delivery_deadline;
        ShipmentStatus status;
        address selected_provider;
        uint256 escrow_amount;
        bool payment_released;
        bool exists;
        uint256 created_at;
        uint256 updated_at;
        address creator;
        string special_instructions;
        uint256 insurance_amount;
    }
    
    struct ProviderBid {
        address provider_address;
        uint256 price;
        uint256 estimated_delivery_time;
        string vehicle_type;
        string vehicle_registration;
        uint256 bid_timestamp;
        uint256 reputation_at_bid;
        bool has_refrigeration;
        bool has_gps_tracking;
        bool has_tamper_seal;
    }
    
    struct ReputationScore {
        uint256 total_score;
        uint256 delivery_count;
        uint256 successful_deliveries;
        uint256 temperature_violations;
        uint256 late_deliveries;
        uint256 disputes_lost;
        uint256 last_updated;
        bool exists;
    }
    
    struct TelemetryReading {
        int256 temperature;
        int256 humidity;
        int256 latitude;
        int256 longitude;
        uint256 timestamp;
        bool tamper_detected;
        uint256 shock_level;
        string device_id;
    }
    
    struct Dispute {
        string shipment_id;
        address initiator;
        address respondent;
        string reason;
        string evidence_hash;
        DisputeStatus status;
        uint256 created_at;
        uint256 resolved_at;
        string resolution_notes;
        uint256 refund_amount;
        address resolver;
        bool exists;
    }
    
    struct ProviderProfile {
        string company_name;
        string registration_number;
        string contact_email;
        string contact_phone;
        bool is_verified;
        uint256 verified_at;
        uint256 total_vehicles;
        string[] certifications;
        bool exists;
    }
    
    // ============ Mappings ============
    mapping(bytes32 => Shipment) private shipments;
    mapping(bytes32 => ProviderBid[]) private bidsByShipment;
    mapping(address => ReputationScore) private reputationScores;
    mapping(bytes32 => TelemetryReading[]) private telemetryByShipment;
    mapping(bytes32 => Dispute) private disputes;
    mapping(address => ProviderProfile) private providerProfiles;
    mapping(bytes32 => string[]) private shipmentDocuments;
    mapping(address => uint256) private providerStakes;
    
    // ============ Configuration ============
    uint256 public min_provider_stake = 0.1 ether;
    uint256 public platform_fee_percent = 25; // 0.25%
    uint256 public reputation_decay_days = 90;
    uint256 public dispute_window_hours = 48;
    uint256 public min_reputation_for_bidding = 100;
    uint256 public max_temperature_violations = 3;
    
    // ============ Events ============
    event ShipmentCreated(
        string indexed shipmentId,
        address indexed creator,
        string pickupLocation,
        string deliveryLocation,
        string cargoType,
        int256 temperatureMin,
        int256 temperatureMax,
        uint256 escrowAmount,
        uint256 pickupTime
    );
    
    event ShipmentStatusUpdated(string indexed shipmentId, ShipmentStatus status, uint256 timestamp);
    event BidSubmitted(
        string indexed shipmentId,
        address indexed providerAddress,
        uint256 price,
        uint256 estimatedDeliveryTime,
        uint256 reputationScore
    );
    event ProviderSelected(string indexed shipmentId, address indexed providerAddress, uint256 ai_score);
    event PickupVerified(string indexed shipmentId, address indexed providerAddress, uint256 timestamp, int256 lat, int256 lng);
    event DeliveryConfirmed(
        string indexed shipmentId, 
        address indexed providerAddress, 
        uint256 timestamp, 
        int256 lat, 
        int256 lng,
        uint256 finalScore
    );
    event TelemetryLogged(
        string indexed shipmentId,
        int256 temperature,
        int256 humidity,
        uint256 timestamp,
        AlertSeverity severity
    );
    event TemperatureViolation(
        string indexed shipmentId,
        int256 actual_temp,
        int256 required_min,
        int256 required_max,
        uint256 timestamp
    );
    event PaymentReleased(string indexed shipmentId, address indexed providerAddress, uint256 amount, uint256 platformFee);
    event ReputationUpdated(address indexed provider, uint256 newScore, uint256 delta, string reason);
    event DisputeCreated(string indexed shipmentId, address indexed initiator, string reason, uint256 disputeId);
    event DisputeResolved(
        string indexed shipmentId, 
        DisputeStatus resolution, 
        uint256 refundAmount,
        address resolver
    );
    event ProviderRegistered(address indexed provider, string companyName, uint256 stakeAmount);
    event ProviderVerified(address indexed provider, uint256 verifiedAt);
    event DocumentAdded(string indexed shipmentId, string documentType, string ipfsHash);
    event AlertTriggered(string indexed shipmentId, string alertType, AlertSeverity severity, string message);
    
    // ============ Modifiers ============
    modifier onlyVerifiedProvider() {
        require(hasRole(PROVIDER_ROLE, msg.sender), "Not a provider");
        require(providerProfiles[msg.sender].is_verified, "Provider not verified");
        _;
    }
    
    modifier shipmentExists(string calldata shipmentId) {
        require(shipments[_shipmentKey(shipmentId)].exists, "Shipment does not exist");
        _;
    }
    
    modifier validShipmentStatus(string calldata shipmentId, ShipmentStatus expected) {
        require(shipments[_shipmentKey(shipmentId)].status == expected, "Invalid shipment status");
        _;
    }
    
    // ============ Constructor ============
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SHIPMENT_MANAGER_ROLE, msg.sender);
        _grantRole(TELEMETRY_ROLE, msg.sender);
        _grantRole(ARBITER_ROLE, msg.sender);
        _grantRole(AI_ORACLE_ROLE, msg.sender);
    }
    
    // ============ Provider Management ============
    function registerProvider(
        string calldata companyName,
        string calldata registrationNumber,
        string calldata contactEmail,
        string calldata contactPhone,
        uint256 totalVehicles
    ) external payable nonReentrant {
        require(msg.value >= min_provider_stake, "Insufficient stake");
        require(!providerProfiles[msg.sender].exists, "Provider already registered");
        
        providerProfiles[msg.sender] = ProviderProfile({
            company_name: companyName,
            registration_number: registrationNumber,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            is_verified: false,
            verified_at: 0,
            total_vehicles: totalVehicles,
            certifications: new string[](0),
            exists: true
        });
        
        providerStakes[msg.sender] = msg.value;
        _grantRole(PROVIDER_ROLE, msg.sender);
        
        // Initialize reputation
        reputationScores[msg.sender] = ReputationScore({
            total_score: 500, // Starting score
            delivery_count: 0,
            successful_deliveries: 0,
            temperature_violations: 0,
            late_deliveries: 0,
            disputes_lost: 0,
            last_updated: block.timestamp,
            exists: true
        });
        
        emit ProviderRegistered(msg.sender, companyName, msg.value);
    }
    
    function verifyProvider(address provider) external onlyRole(ARBITER_ROLE) {
        require(providerProfiles[provider].exists, "Provider not registered");
        providerProfiles[provider].is_verified = true;
        providerProfiles[provider].verified_at = block.timestamp;
        emit ProviderVerified(provider, block.timestamp);
    }
    
    function addProviderCertification(address provider, string calldata certification) external onlyRole(ARBITER_ROLE) {
        providerProfiles[provider].certifications.push(certification);
    }
    
    function withdrawStake() external nonReentrant {
        require(hasRole(PROVIDER_ROLE, msg.sender), "Not a provider");
        require(reputationScores[msg.sender].disputes_lost == 0, "Cannot withdraw with active disputes");
        
        uint256 amount = providerStakes[msg.sender];
        require(amount > 0, "No stake to withdraw");
        
        providerStakes[msg.sender] = 0;
        _revokeRole(PROVIDER_ROLE, msg.sender);
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Stake withdrawal failed");
    }
    
    // ============ Shipment Management ============
    function createShipment(
        string calldata shipmentId,
        string calldata pickupLocation,
        string calldata deliveryLocation,
        string calldata cargoType,
        string calldata cargoDescription,
        int256 temperatureMin,
        int256 temperatureMax,
        int256 humidityMin,
        int256 humidityMax,
        uint256 pickupTime,
        uint256 deliveryDeadline,
        string calldata specialInstructions,
        uint256 insuranceAmount
    ) external payable onlyRole(SHIPMENT_MANAGER_ROLE) whenNotPaused {
        bytes32 key = _shipmentKey(shipmentId);
        require(!shipments[key].exists, "Shipment already exists");
        require(deliveryDeadline > pickupTime, "Invalid deadline");
        require(temperatureMax > temperatureMin, "Invalid temperature range");
        
        shipments[key] = Shipment({
            shipment_id: shipmentId,
            pickup_location: pickupLocation,
            delivery_location: deliveryLocation,
            cargo_type: cargoType,
            cargo_description: cargoDescription,
            temperature_min: temperatureMin,
            temperature_max: temperatureMax,
            humidity_min: humidityMin,
            humidity_max: humidityMax,
            pickup_time: pickupTime,
            delivery_deadline: deliveryDeadline,
            status: ShipmentStatus.CREATED,
            selected_provider: address(0),
            escrow_amount: msg.value,
            payment_released: false,
            exists: true,
            created_at: block.timestamp,
            updated_at: block.timestamp,
            creator: msg.sender,
            special_instructions: specialInstructions,
            insurance_amount: insuranceAmount
        });
        
        emit ShipmentCreated(
            shipmentId,
            msg.sender,
            pickupLocation,
            deliveryLocation,
            cargoType,
            temperatureMin,
            temperatureMax,
            msg.value,
            pickupTime
        );
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.CREATED, block.timestamp);
    }
    
    function submitBid(
        string calldata shipmentId,
        uint256 price,
        uint256 estimatedDeliveryTime,
        string calldata vehicleType,
        string calldata vehicleRegistration,
        bool hasRefrigeration,
        bool hasGpsTracking,
        bool hasTamperSeal
    ) external onlyVerifiedProvider shipmentExists(shipmentId) whenNotPaused {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = shipments[key];
        
        require(
            shipment.status == ShipmentStatus.CREATED || shipment.status == ShipmentStatus.BIDDING,
            "Shipment not open for bids"
        );
        require(estimatedDeliveryTime <= shipment.delivery_deadline, "Cannot meet deadline");
        require(_getReputationScore(msg.sender) >= min_reputation_for_bidding, "Reputation too low");
        require(!_hasExistingBid(key, msg.sender), "Bid already submitted");
        
        ReputationScore storage rep = reputationScores[msg.sender];
        
        bidsByShipment[key].push(ProviderBid({
            provider_address: msg.sender,
            price: price,
            estimated_delivery_time: estimatedDeliveryTime,
            vehicle_type: vehicleType,
            vehicle_registration: vehicleRegistration,
            bid_timestamp: block.timestamp,
            reputation_at_bid: rep.total_score,
            has_refrigeration: hasRefrigeration,
            has_gps_tracking: hasGpsTracking,
            has_tamper_seal: hasTamperSeal
        }));
        
        if (shipment.status == ShipmentStatus.CREATED) {
            shipment.status = ShipmentStatus.BIDDING;
            shipment.updated_at = block.timestamp;
            emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.BIDDING, block.timestamp);
        }
        
        emit BidSubmitted(shipmentId, msg.sender, price, estimatedDeliveryTime, rep.total_score);
    }
    
    function selectProvider(
        string calldata shipmentId,
        address providerAddress,
        uint256 aiScore
    ) external onlyRole(SHIPMENT_MANAGER_ROLE) shipmentExists(shipmentId) whenNotPaused {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = shipments[key];
        
        require(
            shipment.status == ShipmentStatus.CREATED || shipment.status == ShipmentStatus.BIDDING,
            "Cannot select provider in current status"
        );
        require(_hasBidFromProvider(key, providerAddress), "Provider has no bid");
        
        shipment.selected_provider = providerAddress;
        shipment.status = ShipmentStatus.AWAITING_PICKUP;
        shipment.updated_at = block.timestamp;
        
        emit ProviderSelected(shipmentId, providerAddress, aiScore);
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.AWAITING_PICKUP, block.timestamp);
    }
    
    function verifyPickup(
        string calldata shipmentId,
        int256 latitude,
        int256 longitude
    ) external onlyVerifiedProvider shipmentExists(shipmentId) whenNotPaused {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = shipments[key];
        
        require(shipment.status == ShipmentStatus.AWAITING_PICKUP, "Invalid shipment status");
        require(shipment.selected_provider == msg.sender, "Not the selected provider");
        
        shipment.status = ShipmentStatus.IN_TRANSIT;
        shipment.updated_at = block.timestamp;
        
        emit PickupVerified(shipmentId, msg.sender, block.timestamp, latitude, longitude);
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.IN_TRANSIT, block.timestamp);
    }
    
    function logTelemetry(
        string calldata shipmentId,
        int256 temperature,
        int256 humidity,
        int256 latitude,
        int256 longitude,
        bool tamperDetected,
        uint256 shockLevel,
        string calldata deviceId
    ) external onlyRole(TELEMETRY_ROLE) shipmentExists(shipmentId) {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = shipments[key];
        
        TelemetryReading memory reading = TelemetryReading({
            temperature: temperature,
            humidity: humidity,
            latitude: latitude,
            longitude: longitude,
            timestamp: block.timestamp,
            tamper_detected: tamperDetected,
            shock_level: shockLevel,
            device_id: deviceId
        });
        
        telemetryByShipment[key].push(reading);
        
        // Check for temperature violations
        AlertSeverity severity = AlertSeverity.INFO;
        if (temperature < shipment.temperature_min || temperature > shipment.temperature_max) {
            severity = AlertSeverity.CRITICAL;
            if (shipment.selected_provider != address(0)) {
                reputationScores[shipment.selected_provider].temperature_violations++;
            }
            emit TemperatureViolation(
                shipmentId,
                temperature,
                shipment.temperature_min,
                shipment.temperature_max,
                block.timestamp
            );
        } else if (tamperDetected || shockLevel > 50) {
            severity = AlertSeverity.WARNING;
        }
        
        emit TelemetryLogged(shipmentId, temperature, humidity, block.timestamp, severity);
    }
    
    function confirmDelivery(
        string calldata shipmentId,
        int256 latitude,
        int256 longitude,
        bool onTime
    ) external onlyRole(SHIPMENT_MANAGER_ROLE) shipmentExists(shipmentId) nonReentrant {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = shipments[key];
        
        require(shipment.status == ShipmentStatus.IN_TRANSIT, "Shipment not in transit");
        require(!shipment.payment_released, "Payment already released");
        
        shipment.status = ShipmentStatus.DELIVERED;
        shipment.payment_released = true;
        shipment.updated_at = block.timestamp;
        
        // Update provider reputation
        address provider = shipment.selected_provider;
        if (provider != address(0)) {
            ReputationScore storage rep = reputationScores[provider];
            rep.delivery_count++;
            rep.successful_deliveries++;
            
            uint256 scoreDelta = 10;
            if (!onTime) {
                rep.late_deliveries++;
                scoreDelta = 5;
            }
            if (rep.temperature_violations > 0) {
                scoreDelta = scoreDelta > 5 ? scoreDelta - 5 : 1;
            }
            
            rep.total_score += scoreDelta;
            rep.last_updated = block.timestamp;
            
            // Calculate platform fee
            uint256 platformFee = (shipment.escrow_amount * platform_fee_percent) / 10000;
            uint256 providerPayment = shipment.escrow_amount - platformFee;
            
            // Transfer payment to provider
            (bool success, ) = provider.call{value: providerPayment}("");
            require(success, "Payment transfer failed");
            
            emit PaymentReleased(shipmentId, provider, providerPayment, platformFee);
            emit ReputationUpdated(provider, rep.total_score, scoreDelta, onTime ? "On-time delivery" : "Late delivery");
            emit DeliveryConfirmed(shipmentId, provider, block.timestamp, latitude, longitude, rep.total_score);
        }
        
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.DELIVERED, block.timestamp);
    }
    
    // ============ Dispute Resolution ============
    function createDispute(
        string calldata shipmentId,
        string calldata reason,
        string calldata evidenceHash
    ) external shipmentExists(shipmentId) nonReentrant {
        bytes32 shipKey = _shipmentKey(shipmentId);
        Shipment storage shipment = shipments[shipKey];
        
        require(
            shipment.status == ShipmentStatus.IN_TRANSIT || 
            shipment.status == ShipmentStatus.DELIVERED,
            "Cannot dispute at this stage"
        );
        require(
            msg.sender == shipment.creator || msg.sender == shipment.selected_provider,
            "Not authorized to dispute"
        );
        require(block.timestamp <= shipment.created_at + (dispute_window_hours * 1 hours), "Dispute window closed");
        
        bytes32 disputeKey = keccak256(abi.encodePacked(shipmentId, block.timestamp));
        
        disputes[disputeKey] = Dispute({
            shipment_id: shipmentId,
            initiator: msg.sender,
            respondent: msg.sender == shipment.creator ? shipment.selected_provider : shipment.creator,
            reason: reason,
            evidence_hash: evidenceHash,
            status: DisputeStatus.OPEN,
            created_at: block.timestamp,
            resolved_at: 0,
            resolution_notes: "",
            refund_amount: 0,
            resolver: address(0),
            exists: true
        });
        
        shipment.status = ShipmentStatus.DISPUTED;
        shipment.updated_at = block.timestamp;
        
        emit DisputeCreated(shipmentId, msg.sender, reason, uint256(disputeKey));
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.DISPUTED, block.timestamp);
    }
    
    function resolveDispute(
        bytes32 disputeId,
        DisputeStatus resolution,
        string calldata resolutionNotes,
        uint256 refundAmount
    ) external onlyRole(ARBITER_ROLE) nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.exists, "Dispute not found");
        require(dispute.status == DisputeStatus.OPEN || dispute.status == DisputeStatus.UNDER_REVIEW, "Dispute already resolved");
        
        bytes32 shipKey = _shipmentKey(dispute.shipment_id);
        Shipment storage shipment = shipments[shipKey];
        
        dispute.status = resolution;
        dispute.resolution_notes = resolutionNotes;
        dispute.refund_amount = refundAmount;
        dispute.resolver = msg.sender;
        dispute.resolved_at = block.timestamp;
        
        if (resolution == DisputeStatus.RESOLVED_PROVIDER_FAULT) {
            reputationScores[dispute.respondent].disputes_lost++;
            reputationScores[dispute.respondent].total_score = 
                reputationScores[dispute.respondent].total_score > 50 ? 
                reputationScores[dispute.respondent].total_score - 50 : 0;
            
            // Slash provider stake
            if (refundAmount > 0 && refundAmount <= providerStakes[dispute.respondent]) {
                providerStakes[dispute.respondent] -= refundAmount;
                (bool success, ) = dispute.initiator.call{value: refundAmount}("");
                require(success, "Refund transfer failed");
            }
        } else if (resolution == DisputeStatus.RESOLVED_SHIPPER_FAULT) {
            reputationScores[dispute.initiator].disputes_lost++;
        }
        
        shipment.status = ShipmentStatus.RESOLVED;
        shipment.updated_at = block.timestamp;
        
        emit DisputeResolved(dispute.shipment_id, resolution, refundAmount, msg.sender);
        emit ShipmentStatusUpdated(dispute.shipment_id, ShipmentStatus.RESOLVED, block.timestamp);
    }
    
    // ============ Document Management ============
    function addDocument(
        string calldata shipmentId,
        string calldata documentType,
        string calldata ipfsHash
    ) external shipmentExists(shipmentId) {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = shipments[key];
        
        require(
            msg.sender == shipment.creator || 
            msg.sender == shipment.selected_provider ||
            hasRole(ARBITER_ROLE, msg.sender),
            "Not authorized"
        );
        
        shipmentDocuments[key].push(ipfsHash);
        emit DocumentAdded(shipmentId, documentType, ipfsHash);
    }
    
    // ============ Admin Functions ============
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    function updatePlatformFee(uint256 newFeePercent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeePercent <= 500, "Fee too high"); // Max 5%
        platform_fee_percent = newFeePercent;
    }
    
    function updateMinStake(uint256 newStake) external onlyRole(DEFAULT_ADMIN_ROLE) {
        min_provider_stake = newStake;
    }
    
    function withdrawPlatformFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        uint256 locked = 0;
        
        // Calculate locked funds (escrow for non-delivered shipments)
        // This is a simplified calculation - in production, track locked funds explicitly
        
        uint256 withdrawable = balance - locked;
        require(withdrawable > 0, "No funds to withdraw");
        
        (bool success, ) = payable(msg.sender).call{value: withdrawable}("");
        require(success, "Withdrawal failed");
    }
    
    // ============ View Functions ============
    function getShipment(string calldata shipmentId) external view returns (Shipment memory) {
        return shipments[_shipmentKey(shipmentId)];
    }
    
    function getBids(string calldata shipmentId) external view returns (ProviderBid[] memory) {
        return bidsByShipment[_shipmentKey(shipmentId)];
    }
    
    function getReputation(address provider) external view returns (ReputationScore memory) {
        return reputationScores[provider];
    }
    
    function getTelemetry(string calldata shipmentId) external view returns (TelemetryReading[] memory) {
        return telemetryByShipment[_shipmentKey(shipmentId)];
    }
    
    function getProviderProfile(address provider) external view returns (ProviderProfile memory) {
        return providerProfiles[provider];
    }
    
    function getDocuments(string calldata shipmentId) external view returns (string[] memory) {
        return shipmentDocuments[_shipmentKey(shipmentId)];
    }
    
    function getProviderStake(address provider) external view returns (uint256) {
        return providerStakes[provider];
    }
    
    // ============ Internal Functions ============
    function _shipmentKey(string calldata shipmentId) internal pure returns (bytes32) {
        return keccak256(bytes(shipmentId));
    }
    
    function _getReputationScore(address provider) internal view returns (uint256) {
        return reputationScores[provider].exists ? reputationScores[provider].total_score : 0;
    }
    
    function _hasBidFromProvider(bytes32 key, address provider) internal view returns (bool) {
        ProviderBid[] storage bids = bidsByShipment[key];
        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].provider_address == provider) {
                return true;
            }
        }
        return false;
    }
    
    function _hasExistingBid(bytes32 key, address provider) internal view returns (bool) {
        return _hasBidFromProvider(key, provider);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}
}
